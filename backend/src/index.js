require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const filesRoutes = require('./routes/files');
const usersRoutes = require('./routes/users');
const csrfProtect = require('./middleware/csrf');

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
// Apply Origin-based CSRF protection to state-changing API routes.
app.use('/api/auth', csrfProtect);
app.use('/api/files', csrfProtect);
app.use('/api/users', csrfProtect);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[BakeSync] Unhandled error:', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`[BakeSync] Backend running on port ${PORT}`);
    console.log(`[BakeSync] CORS enabled for: ${process.env.FRONTEND_URL}`);
});
