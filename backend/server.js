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

// ── GUILD ALIASES ────────────────────────────────────────────────────────────
// Our guild has changed names over time. Collapse all past names to the current
// one ("FTP") so stats aren't split across what looks like four separate guilds.
// Any name NOT in this map is treated as an enemy guild and kept as-is.
const MY_GUILD = 'FTP';
const GUILD_ALIASES = {
  'FTP': MY_GUILD,
  'PUSH': MY_GUILD,
  'House Regard': MY_GUILD,
  'Best Regards': MY_GUILD,
};
const canonicalGuild = (name) => GUILD_ALIASES[(name || '').trim()] || (name || '').trim() || 'Unknown';

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
    // Total Matches
    const { count: totalMatches } = await supabase
      .from('wargame_matches')
      .select('*', { count: 'exact', head: true });

    // Aggregation via RPC — bypasses the 1,000-row PostgREST limit entirely.
    // Called with no argument; the SQL function already scopes to our guild's names.
    const { data: aggData, error: aggError } = await supabase
      .rpc('get_stats_summary');

    if (aggError) throw aggError;

    const totalKills   = Number(aggData[0]?.total_kills)   || 0;
    const totalDamage  = Number(aggData[0]?.total_damage)  || 0;
    const totalHealing = Number(aggData[0]?.total_healing) || 0;

    res.json({
      totalMatches:  totalMatches || 0,
      totalKills:    totalKills.toLocaleString(),
      totalDamage:   (totalDamage  / 1_000_000).toFixed(1) + "M",
      totalHealing:  (totalHealing / 1_000_000).toFixed(1) + "M"
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
    // Clamp the limit so a caller can't request, say, ?limit=100000
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 6, 1), 50);

    const { data: matches, error } = await supabase
      .from('wargame_matches')
      .select('*')
      .order('match_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!matches || matches.length === 0) return res.json([]);

    // Single query for every player row across all matches (no N+1)
    const matchIds = matches.map(m => m.id);
    const { data: allPlayers, error: pError } = await supabase
      .from('player_match_stats')
      .select('match_id, guild_name, kills, damage_dealt, healing')
      .in('match_id', matchIds);

    if (pError) throw pError;

    // Group player rows by match_id in memory
    const playersByMatch = {};
    (allPlayers || []).forEach(p => {
      (playersByMatch[p.match_id] ||= []).push(p);
    });

    const enriched = matches.map(match => {
      const players = playersByMatch[match.id] || [];
      const guildStats = {};

      players.forEach(p => {
        const g = canonicalGuild(p.guild_name);
        if (!guildStats[g]) guildStats[g] = { kills: 0, damage: 0, healing: 0 };
        guildStats[g].kills += Number(p.kills) || 0;
        guildStats[g].damage += Number(p.damage_dealt) || 0;
        guildStats[g].healing += Number(p.healing) || 0;
      });

      // Our guild vs. everyone else (handles matches with 2+ enemy guilds)
      const myKills = guildStats[MY_GUILD]?.kills || 0;
      const enemyKills = Object.entries(guildStats)
        .filter(([g]) => g !== MY_GUILD)
        .reduce((sum, [, s]) => sum + s.kills, 0);

      const killDifference = Math.abs(myKills - enemyKills);
      const winningGuild = myKills >= enemyKills ? MY_GUILD : 'Enemy';

      return {
        ...match,
        kills: Object.values(guildStats).reduce((sum, g) => sum + g.kills, 0),
        damage: Object.values(guildStats).reduce((sum, g) => sum + g.damage, 0),
        healing: Object.values(guildStats).reduce((sum, g) => sum + g.healing, 0),
        killDifference,
        winningGuild
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Recent matches error:', err);
    res.json([]);
  }
});
// ── MATCH DETAIL WITH RED vs YELLOW TEAMS ───────────────────────────────────
app.get('/api/match/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: "Supabase not initialized" });
  }

  try {
    const { id } = req.params;

    // Get match info
    const { data: match, error: matchError } = await supabase
      .from('wargame_matches')
      .select('*')
      .eq('id', id)
      .single();

    if (matchError) throw matchError;

    // Get players
    const { data: players, error: playersError } = await supabase
      .from('player_match_stats')
      .select('*')
      .eq('match_id', id)
      .order('rank', { ascending: true });

    if (playersError) throw playersError;

    // Class Breakdown
    const classCount = {};
    players.forEach(p => {
      const className = getClassNameBackend(p.weapon_1, p.weapon_2);
      classCount[className] = (classCount[className] || 0) + 1;
    });

    // Team Stats by team_color (Red vs Yellow)
    const teamStats = {
      Red: { kills: 0, damage_dealt: 0, damage_taken: 0, healing: 0 },
      Yellow: { kills: 0, damage_dealt: 0, damage_taken: 0, healing: 0 }
    };

    players.forEach(p => {
      const color = (p.team_color || '').toLowerCase();
      const teamKey = color === 'red' ? 'Red' : color === 'yellow' ? 'Yellow' : 'Unknown';

      if (teamStats[teamKey]) {
        teamStats[teamKey].kills += Number(p.kills || 0);
        teamStats[teamKey].damage_dealt += Number(p.damage_dealt || 0);
        teamStats[teamKey].damage_taken += Number(p.damage_taken || 0);
        teamStats[teamKey].healing += Number(p.healing || 0);
      }
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

// Backend Class Helper
function getClassNameBackend(weapon1, weapon2) {
  if (!weapon1) return "Unknown";
  const w1 = (weapon1 || "").trim();
  const w2 = (weapon2 || "").trim();

  const mappings = {
    "CrossbowDaggers": "Scorpion", "CrossbowGreatsword": "Outrider", "CrossbowLongbow": "Scout",
    "CrossbowOrb": "Crucifix", "CrossbowSnS": "Raider", "CrossbowSpear": "Cavalier",
    "CrossbowStaff": "Battleweaver", "CrossbowWand": "Fury", "DaggersOrb": "Lunarch",
    "DaggersWand": "Darkblighter", "GreatswordDaggers": "Ravager", "GreatswordLongbow": "Ranger",
    "GreatswordOrb": "Justicar", "GreatswordSpear": "Gladiator", "GreatswordWand": "Paladin",
    "LongbowDaggers": "Infiltrator", "LongbowOrb": "Scryer", "SnSDaggers": "Berserker",
    "SnSGreatsword": "Crusader", "SnSLongbow": "Warden", "SnSOrb": "Guardian",
    "SnSSpear": "Steelheart", "SnSStaff": "Disciple", "SnSWand": "Templar",
    "SpearDaggers": "Shadowdancer", "SpearLongbow": "Impaler", "SpearOrb": "Polaris",
    "SpearWand": "Voidlance", "StaffDaggers": "Spellblade", "StaffGreatsword": "Sentinel",
    "StaffLongbow": "Liberator", "StaffOrb": "Enigma", "StaffSpear": "Eradicator",
    "StaffWand": "Invocator", "WandLongbow": "Seeker", "WandOrb": "Oracle"
  };

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