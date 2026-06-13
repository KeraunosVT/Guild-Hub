// backend/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

console.log("✅ Server started successfully");

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ── SAFE SUPABASE INTEGRATION ─────────────────────────────────────
let supabase = null;

try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
    console.log("✅ Supabase client initialized");
} catch (e) {
    console.error("❌ Failed to initialize Supabase:", e.message);
}

// Debug count
app.get('/api/debug/count', async (req, res) => {
    if (!supabase) {
        return res.json({ error: "Supabase not initialized" });
    }
    try {
        const { count, error } = await supabase
            .from('player_match_stats')
            .select('*', { count: 'exact', head: true });

        res.json({ total_rows: count || 0, error: error ? error.message : null });
    } catch (err) {
        res.json({ error: err.message });
    }
});

// Stats Summary
app.get('/api/stats/summary', async (req, res) => {
    if (!supabase) {
        return res.json({ totalMatches: 0, totalKills: "—", totalDamage: "—", totalHealing: "—" });
    }
    try {
        const { count } = await supabase
            .from('player_match_stats')
            .select('*', { count: 'exact', head: true });

        res.json({
            totalMatches: count || 0,
            totalKills: "—",
            totalDamage: "—",
            totalHealing: "—"
        });
    } catch (err) {
        res.json({ totalMatches: 0, totalKills: "—", totalDamage: "—", totalHealing: "—" });
    }
});

// Recent Matches
app.get('/api/matches/recent', async (req, res) => {
    if (!supabase) return res.json([]);
    try {
        const { data } = await supabase
            .from('wargame_matches')
            .select('*')
            .order('match_date', { ascending: false })
            .limit(6);
        res.json(data || []);
    } catch (err) {
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