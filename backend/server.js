// backend/server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Debug endpoint
app.get('/api/debug/count', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('player_match_stats')
      .select('*', { count: 'exact', head: true });

    res.json({
      total_rows: count || 0,
      error: error ? error.message : null
    });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Stats Summary
app.get('/api/stats/summary', async (req, res) => {
  try {
    const { count: totalMatches } = await supabase
      .from('player_match_stats')
      .select('*', { count: 'exact', head: true });

    res.json({
      totalMatches: totalMatches || 0,
      totalKills: "—",
      totalDamage: "—",
      totalHealing: "—"
    });
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.json([]);
  }
});

// Serve React Frontend
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});