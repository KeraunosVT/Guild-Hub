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

// ── RECENT MATCHES WITH KILL DIFFERENCE ─────────────────────────────────────
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

    // For each match, calculate kill difference between guilds
    const enrichedMatches = await Promise.all(matches.map(async (match) => {
      const { data: playerStats } = await supabase
        .from('player_match_stats')
        .select('guild_name, kills')
        .eq('match_id', match.id);

      const guildStats = {};
      playerStats.forEach(p => {
        if (!guildStats[p.guild_name]) guildStats[p.guild_name] = 0;
        guildStats[p.guild_name] += Number(p.kills) || 0;
      });

      const guilds = Object.keys(guildStats);
      const killDiff = guilds.length === 2 
        ? Math.abs(guildStats[guilds[0]] - guildStats[guilds[1]]) 
        : 0;

      return {
        ...match,
        guildKills: guildStats,
        killDifference: killDiff,
        winningGuild: Object.keys(guildStats).reduce((a, b) => 
          guildStats[a] > guildStats[b] ? a : b
        )
      };
    }));

    res.json(enrichedMatches);
  } catch (err) {
    console.error('Recent matches error:', err);
    res.json([]);
  }
});

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