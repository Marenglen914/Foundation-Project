// util/middleware/authorizeRole.js

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient role.' });
        }
        next();
    };
};

module.exports = authorizeRole;
