const isProd = process.env.NODE_ENV === 'production';

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days, matches generateToken's expiresIn

// Set COOKIE_DOMAIN (e.g. ".tapaware.online") when the frontend and the API live
// on different subdomains of one parent domain. Without it a cookie is host-only,
// so a page on tapaware.online cannot read a cookie issued by api.tapaware.online
// — which silently breaks CSRF, since the frontend has to read XSRF-TOKEN and echo
// it back as a header. Leave it unset locally, where both sides share "localhost".
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

// The auth cookie stays host-only on purpose: it is httpOnly and only ever needs
// to travel to the API, so there is nothing to gain by widening it to every
// subdomain.
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
    domain: cookieDomain,
};

// A cookie issued before COOKIE_DOMAIN existed is host-only, which makes it a
// *different* cookie from the domain-scoped one rather than an older version of
// it. Both are sent to the API, cookie-parser keeps whichever comes first, and
// CSRF then compares that stale value against the fresh header — a 403 that
// setting the new cookie alone will never clear. Expiring this variant whenever
// we issue or clear the real one lets a plain re-login heal any browser that
// still holds the old pair.
const legacyCsrfCookieOptions = { ...csrfCookieOptions, domain: undefined };

module.exports = { authCookieOptions, csrfCookieOptions, legacyCsrfCookieOptions };
