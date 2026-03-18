/**
 * Role-Based Access Control Middleware Factory
 * Creates middleware that checks if user has required role
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient role' });
        }

        next();
    };
}

module.exports = { requireRole };
