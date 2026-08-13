const isProd = process.env.NODE_ENV === 'production';

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days, matches generateToken's expiresIn

const authCookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
};

const csrfCookieOptions = {
    httpOnly: false, // must be JS-readable so the frontend can echo it back as a header
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: TOKEN_MAX_AGE,
};

module.exports = { authCookieOptions, csrfCookieOptions };
