const rateLimit = require('express-rate-limit');
const auditLog = require('../utils/auditLogger');

// Tracks which identifiers have already had a rate-limit trigger logged
// this window, so a single burst of blocked requests produces one audit
// entry instead of one per request. Keyed by "actionName:identifier" so
// different limiters/users don't collide.
const alreadyLoggedThisWindow = new Set();

// Runs instead of the limiter's default response once the limit is hit —
// logs only the FIRST block per identifier per window, then sends the
// same response the limiter would have sent anyway.
const logAndRespond = (actionName, getDetails, windowMs) => (req, res, next, options) => {
    const identifier = getDetails(req);
    const logKey = `${actionName}:${identifier}`;

    if (!alreadyLoggedThisWindow.has(logKey)) {
        alreadyLoggedThisWindow.add(logKey);

        auditLog({
            user_id: null,
            user_name: identifier,
            user_role: 'anonymous',
            action: actionName,
            table_affected: 'null',
            details: `Rate limit exceeded on ${req.originalUrl}`,
            ip_address: req.ip
        }).catch((error) => console.log('Failed to log rate limit trigger:', error.message));

        // Clear this one identifier once the limiter's own window would
        // have reset anyway — keeps the Set from growing forever, and
        // means the next window's first trigger gets logged again too.
        setTimeout(() => alreadyLoggedThisWindow.delete(logKey), windowMs);
    }

    res.status(options.statusCode).json(options.message);
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts, please try again after 15 minutes' },
    handler: logAndRespond('LOGIN_RATE_LIMIT_EXCEEDED', (req) => req.body?.email || 'Unknown email', 15 * 60 * 1000)
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: { message: 'Too many reset requests, please try again after 15 minutes' },
    handler: logAndRespond('FORGOT_PASSWORD_RATE_LIMIT_EXCEEDED', (req) => req.body?.email || 'Unknown email', 15 * 60 * 1000)
});

const concernLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { message: 'Too many submissions from this device, please try again later' },
    handler: logAndRespond('CONCERN_RATE_LIMIT_EXCEEDED', (req) => req.body?.name || 'Anonymous', 60 * 60 * 1000)
});

module.exports = { loginLimiter, forgotPasswordLimiter, concernLimiter };