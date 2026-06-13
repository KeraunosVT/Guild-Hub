// backend/server.js
const express = require('express');
const path = require('path');

const app = express();

console.log("✅ Server starting...");

// Basic route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is alive' });
});

app.get('/api/debug/count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('player_match_stats')
      .select('*', { count: 'exact', head: true });

    res.json({
      total_rows: count,
      error: error ? error.message : null
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ── STATS SUMMARY ────────────────────────────────────────────────────────────
app.get('/api/stats/summary', async (req, res) => {
  try {
    const { count: totalMatches, error: countError } = await supabase
      .from('player_match_stats')
      .select('*', { count: 'exact', head: true });

    const { data: totals, error: totalsError } = await supabase
      .from('player_match_stats')
      .select('kills, damage_dealt, healing')
      .limit(1); // We can sum later if needed

    if (countError) throw countError;

    res.json({
      totalMatches: totalMatches || 0,
      totalKills: "—",      // We'll improve this later
      totalDamage: "—",
      totalHealing: "—"
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.json({
      totalMatches: 0,
      totalKills: "—",
      totalDamage: "—",
      totalHealing: "—"
    });
  }
});

// ── RECENT MATCHES ───────────────────────────────────────────────────────────
app.get('/api/matches/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const { data, error } = await supabase
      .from('wargame_matches')
      .select(`
        *,
        player_match_stats (
          kills,
          damage_dealt,
          healing
        )
      `)
      .order('match_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('Recent matches error:', err);
    res.status(500).json([]);
  }
});

// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend/dist');
    console.log(`📦 Serving static files from: ${frontendPath}`);
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('<h1>Backend is running - Go to /api/health</h1>');
    });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server successfully started on port ${PORT}`);
});