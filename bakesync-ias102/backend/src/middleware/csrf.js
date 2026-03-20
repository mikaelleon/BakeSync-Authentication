/**
 * CSRF protection via Origin validation.
 * This project uses stateless JWT in Authorization header (no cookies),
 * so we only do lightweight Origin checks to mitigate CSRF-style attacks.
 */

const allowedDevOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500'];

function getAllowedOrigins() {
    const origins = new Set();

    const frontendUrl = process.env.FRONTEND_URL ? String(process.env.FRONTEND_URL).trim() : '';
    if (frontendUrl) origins.add(frontendUrl);

    allowedDevOrigins.forEach((o) => origins.add(o));

    return Array.from(origins);
}

function csrfProtect(req, res, next) {
    // Only enforce for state-changing requests.
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();

    const origin = req.headers.origin;

    // Improvement selection: lenient mode => allow missing Origin header.
    // (Hard-blocking missing Origin tends to break legitimate clients.)
    if (!origin) return next();

    const allowed = getAllowedOrigins();
    const ok = allowed.includes(String(origin).trim());
    if (!ok) {
        return res.status(403).json({ error: 'CSRF validation failed' });
    }

    next();
}

module.exports = csrfProtect;

