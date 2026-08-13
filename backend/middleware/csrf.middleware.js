const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

exports.verifyCsrf = (req, res, next) => {
    if (!CSRF_METHODS.includes(req.method)) {
        return next();
    }

    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ message: 'Invalid or missing CSRF token' });
    }

    next();
};
