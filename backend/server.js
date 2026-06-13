// backend/server.js
const express = require('express');
const path = require('path');

const app = express();

console.log("✅ Server file loaded successfully");

// Basic route
app.get('/', (req, res) => {
    res.send(`
        <h1>✅ Backend is Running</h1>
        <p>React frontend should be served below.</p>
        <p><a href="/api/health">Health Check</a></p>
    `);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is alive' });
});

// Serve React app
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on port ${PORT}`);
});