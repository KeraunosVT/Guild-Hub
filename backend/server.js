// backend/server.js
const express = require('express');
const path = require('path');

const app = express();

console.log("✅ Server starting...");

// Basic route
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is alive' });
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