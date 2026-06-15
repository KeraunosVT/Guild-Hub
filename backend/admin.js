// backend/admin.js — admin-only match ingest. Mounted behind requireAdmin.
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { parseScreenshot, parseCsv } = require('./ingest');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

function toInt(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = parseInt(String(v).replace(/[, ]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}
const clean = (v) => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};
const team = (v) => {
  const s = String(v || '').trim().toLowerCase();
  if (s.startsWith('r')) return 'Red';
  if (s.startsWith('y')) return 'Yellow';
  return null;
};

module.exports = function createAdminRouter(supabase) {
  const router = express.Router();

  router.get('/whoami', (req, res) => {
    res.json({ admin: true, username: req.user.username });
  });

  // ── Parse an upload into draft rows (no DB writes) ──────────────────────────
  router.post('/match/parse', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const { originalname, mimetype, buffer } = req.file;

    try {
      let result;
      if (mimetype.startsWith('image/')) {
        result = await parseScreenshot(buffer, mimetype);
      } else if (mimetype === 'text/csv' || /\.csv$/i.test(originalname)) {
        result = parseCsv(buffer.toString('utf8'));
      } else {
        return res.status(400).json({ error: 'Upload a PNG/JPG screenshot or a CSV file.' });
      }
      res.json(result);
    } catch (err) {
      console.error('Parse error:', err.message);
      res.status(502).json({ error: err.message || 'Could not read the upload.' });
    }
  });

  // ── Commit reviewed rows: create match + insert players ─────────────────────
  router.post('/match/commit', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Database not configured.' });

    const { title, match_date, players } = req.body || {};
    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'No players to save.' });
    }

    const matchId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    // 1. Create the match row
    const { error: mErr } = await supabase.from('wargame_matches').insert({
      id: matchId,
      title: clean(title) || 'Wargame',
      match_date: clean(match_date),
      created_at: nowIso,
    });
    if (mErr) {
      console.error('Match insert error:', mErr.message);
      return res.status(500).json({ error: 'Failed to create the match.' });
    }

    // 2. Insert the player rows
    const rows = players.map((p) => ({
      id: crypto.randomUUID(),
      match_id: matchId,
      rank: toInt(p.rank),
      weapon_1: clean(p.weapon_1),
      weapon_2: clean(p.weapon_2),
      guild_name: clean(p.guild_name),
      player_name: clean(p.player_name),
      team_color: team(p.team_color),
      kills: toInt(p.kills),
      assists: toInt(p.assists),
      damage_dealt: toInt(p.damage_dealt),
      damage_taken: toInt(p.damage_taken),
      healing: toInt(p.healing),
      created_at: nowIso,
    }));

    const { error: pErr } = await supabase.from('player_match_stats').insert(rows);
    if (pErr) {
      console.error('Players insert error:', pErr.message);
      // No cross-table transaction here, so clean up the orphan match row.
      await supabase.from('wargame_matches').delete().eq('id', matchId);
      return res.status(500).json({ error: 'Failed to save players — match was rolled back.' });
    }

    res.json({ match_id: matchId, inserted: rows.length });
  });

  return router;
};
