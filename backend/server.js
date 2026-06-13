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

// Stats Summary - Updated to use wargame_matches
app.get('/api/stats/summary', async (req, res) => {
    if (!supabase) {
        return res.json({ totalMatches: 0, totalKills: "—", totalDamage: "—", totalHealing: "—" });
    }
    try {
        // Count from wargame_matches as requested
        const { count: totalMatches, error: matchError } = await supabase
            .from('wargame_matches')
            .select('*', { count: 'exact', head: true });

        if (matchError) throw matchError;

        res.json({
            totalMatches: totalMatches || 0,
            totalKills: "—",
            totalDamage: "—",
            totalHealing: "—"
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