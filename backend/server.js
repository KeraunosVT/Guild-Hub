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

// ── IMPROVED STATS SUMMARY WITH GUILD FILTER ─────────────────────────────────
app.get('/api/stats/summary', async (req, res) => {
  if (!supabase) {
    return res.json({ totalMatches: 0, totalKills: "—", totalDamage: "—", totalHealing: "—" });
  }

  try {
    const guildFilter = req.query.guild; // e.g. ?guild=FTP or ?guild=House Regard

    let query = supabase
      .from('player_match_stats')
      .select('kills, damage_dealt, healing, guild_name');

    // Apply guild filter if provided
    if (guildFilter) {
      query = query.eq('guild_name', guildFilter);
    } else {
      // Default to your main guilds if no filter
      query = query.in('guild_name', ['FTP', 'PUSH', 'House Regard', 'Best Regards']);
    }

    const { data: statsData, error } = await query;

    if (error) throw error;

    let totalKills = 0;
    let totalDamage = 0;
    let totalHealing = 0;

    statsData.forEach(row => {
      totalKills += row.kills || 0;
      totalDamage += row.damage_dealt || 0;
      totalHealing += row.healing || 0;
    });

    // Get total matches (from wargame_matches or distinct match_id)
    const { count: totalMatches } = await supabase
      .from('wargame_matches')
      .select('*', { count: 'exact', head: true });

    res.json({
      totalMatches: totalMatches || 0,
      totalKills: totalKills.toLocaleString(),
      totalDamage: (totalDamage / 1000000).toFixed(1) + "M",
      totalHealing: (totalHealing / 1000000).toFixed(1) + "M",
      filteredGuild: guildFilter || "All Tracked Guilds"
    });
  } catch (err) {
    console.error('Stats summary error:', err);
    res.json({
      totalMatches: 0,
      totalKills: "—",
      totalDamage: "—",
      totalHealing: "—"
    });
  }
});

// Recent Matches
app.get('/api/matches/recent', async (req, res) => {
    if (!supabase) return res.json([]);
    try {
        const limit = parseInt(req.query.limit) || 6;

        const { data, error } = await supabase
            .from('wargame_matches')
            .select('*')
            .order('match_date', { ascending: false })
            .limit(limit);

        if (error) throw error;

        res.json(data || []);
    } catch (err) {
        console.error('Recent matches error:', err);
        res.json([]);
    }
});

// Serve React Frontend
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});