// backend/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

console.log("✅ Server started successfully");

// ── SUPABASE SETUP ───────────────────────────────────────────────────────────
let supabase = null;
try {
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  console.log("✅ Supabase client initialized");
} catch (e) {
  console.error("❌ Supabase failed to initialize:", e.message);
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Debug count
app.get('/api/debug/count', async (req, res) => {
  if (!supabase) return res.json({ error: "Supabase not initialized" });
  try {
    const { count, error } = await supabase
      .from('player_match_stats')
      .select('*', { count: 'exact', head: true });
    res.json({ total_rows: count || 0, error: error?.message });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ── STATS SUMMARY ────────────────────────────────────────────────────────────
app.get('/api/stats/summary', async (req, res) => {
  if (!supabase) {
    return res.json({ totalMatches: 0, totalKills: "—", totalDamage: "—", totalHealing: "—" });
  }

  try {
    const guildFilter = req.query.guild;

    // Total Matches
    const { count: totalMatches } = await supabase
      .from('wargame_matches')
      .select('*', { count: 'exact', head: true });

    // Aggregation via RPC — bypasses the 1,000-row PostgREST limit entirely
    const { data: aggData, error: aggError } = await supabase
      .rpc('get_stats_summary', {
        guild_filter: guildFilter || null
      });

    if (aggError) throw aggError;

    const totalKills   = Number(aggData[0]?.total_kills)   || 0;
    const totalDamage  = Number(aggData[0]?.total_damage)  || 0;
    const totalHealing = Number(aggData[0]?.total_healing) || 0;

    res.json({
      totalMatches:  totalMatches || 0,
      totalKills:    totalKills.toLocaleString(),
      totalDamage:   (totalDamage  / 1_000_000).toFixed(1) + "M",
      totalHealing:  (totalHealing / 1_000_000).toFixed(1) + "M",
      filteredGuild: guildFilter || "All Tracked Guilds"
    });

  } catch (err) {
    console.error('Stats error:', err);
    res.json({
      totalMatches: 0,
      totalKills:   "—",
      totalDamage:  "—",
      totalHealing: "—"
    });
  }
});

// ── REAL RECENT MATCHES WITH STATS ──────────────────────────────────────────
app.get('/api/matches/recent', async (req, res) => {
  if (!supabase) return res.json([]);

  try {
    const limit = parseInt(req.query.limit) || 6;

    const { data: matches, error } = await supabase
      .from('wargame_matches')
      .select('*')
      .order('match_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const enriched = await Promise.all(matches.map(async (match) => {
      const { data: players, error: pError } = await supabase
        .from('player_match_stats')
        .select('guild_name, kills, damage_dealt, healing')
        .eq('match_id', match.id);

      if (pError) {
        console.error('Player stats error for match', match.id, pError);
        return { ...match, kills: 0, damage: 0, healing: 0, killDifference: 0 };
      }

      const guildStats = {};

      players.forEach(p => {
        const g = p.guild_name || 'Unknown';
        if (!guildStats[g]) guildStats[g] = { kills: 0, damage: 0, healing: 0 };
        guildStats[g].kills += Number(p.kills) || 0;
        guildStats[g].damage += Number(p.damage_dealt) || 0;
        guildStats[g].healing += Number(p.healing) || 0;
      });

      const guilds = Object.keys(guildStats);
      let killDifference = 0;
      let winningGuild = null;

      if (guilds.length >= 2) {
        const g1 = guilds[0];
        const g2 = guilds[1];
        killDifference = Math.abs(guildStats[g1].kills - guildStats[g2].kills);
        winningGuild = guildStats[g1].kills > guildStats[g2].kills ? g1 : g2;
      }

      return {
        ...match,
        kills: Object.values(guildStats).reduce((sum, g) => sum + g.kills, 0),
        damage: Object.values(guildStats).reduce((sum, g) => sum + g.damage, 0),
        healing: Object.values(guildStats).reduce((sum, g) => sum + g.healing, 0),
        killDifference,
        winningGuild
      };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Recent matches error:', err);
    res.json([]);
  }
});
// ── MATCH DETAIL WITH CLASS + TEAM BREAKDOWN ─────────────────────────────────
app.get('/api/match/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not initialized" });
  }

  try {
    const { id } = req.params;

    const { data: match } = await supabase
      .from('wargame_matches')
      .select('*')
      .eq('id', id)
      .single();

    const { data: players } = await supabase
      .from('player_match_stats')
      .select('*')
      .eq('match_id', id)
      .order('rank', { ascending: true });

    // Class Breakdown
    const classCount = {};
    players.forEach(p => {
      const className = getClassNameBackend(p.weapon_1, p.weapon_2);
      classCount[className] = (classCount[className] || 0) + 1;
    });

    // Team (Guild) Stats
    const teamStats = {};
    players.forEach(p => {
      const guild = p.guild_name || "Unknown";
      if (!teamStats[guild]) {
        teamStats[guild] = { kills: 0, damage_dealt: 0, damage_taken: 0, healing: 0 };
      }
      teamStats[guild].kills += p.kills || 0;
      teamStats[guild].damage_dealt += p.damage_dealt || 0;
      teamStats[guild].damage_taken += p.damage_taken || 0;
      teamStats[guild].healing += p.healing || 0;
    });

    res.json({
      match: match || {},
      players: players || [],
      classBreakdown: Object.entries(classCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      teamStats: teamStats
    });
  } catch (err) {
    console.error('Match detail error:', err);
    res.status(500).json({ error: 'Failed to load match details' });
  }
});

// Backend helper
function getClassNameBackend(weapon1, weapon2) {
  if (!weapon1) return "Unknown";
  const w1 = (weapon1 || "").trim();
  const w2 = (weapon2 || "").trim();

  const mappings = { /* same full mapping as before */ };

  let key = (w1 + w2).replace(/\s+/g, '');
  if (mappings[key]) return mappings[key];

  key = (w2 + w1).replace(/\s+/g, '');
  if (mappings[key]) return mappings[key];

  return `${w1} ${w2}`.trim() || "Unknown";
}

// ── SERVE REACT FRONTEND ─────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});