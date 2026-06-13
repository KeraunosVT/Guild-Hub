// backend/server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://tnlstats.com', 'https://staging.tnlstats.com'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Basic health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Simple auth status for React
app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: false }); // You can expand this later
});

// ── PRODUCTION: SERVE REACT APP ─────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../frontend/dist');
    app.use(express.static(frontendPath));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Backend is running - Go to http://localhost:5173 for frontend');
    });
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});