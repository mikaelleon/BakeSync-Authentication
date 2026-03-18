require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const filesRoutes = require('./routes/files');

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'BakeSync API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            dashboard: '/api/dashboard',
            files: '/api/files'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'bakesync-backend' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', filesRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`BakeSync API running on port ${PORT}`);
    console.log(`CORS enabled for: ${process.env.FRONTEND_URL}`);
});
