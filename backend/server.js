// backend/server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

console.log("✅ Server starting...");

// Health check (always works)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// ── DEBUG COUNT ─────────────────────────────────────────────────────────────
app.get('/api/debug/count', async (req, res) => {
  res.json({ message: "Debug endpoint works - Supabase connection not tested yet" });
});

// Serve React frontend
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('<h1>Backend is running</h1><p><a href="/api/health">Check Health</a></p>');
    });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server successfully started on port ${PORT}`);
});