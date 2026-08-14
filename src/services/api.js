import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://tapaware-production.up.railway.app/api',
    withCredentials: true,
});

const CSRF_METHODS = ['post', 'put', 'patch', 'delete'];

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

API.interceptors.request.use((config) => {
    const method = (config.method || '').toLowerCase();
    if (CSRF_METHODS.includes(method)) {
        const csrfToken = getCookie('XSRF-TOKEN');
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return config;
});

const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/reset-password'];

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';

        // /auth/me is expected to 401 for anonymous visitors — AuthContext already
        // handles that by setting user to null, so it must never trigger a redirect.
        const isSessionCheck = url.includes('/auth/me');
        const onPublicPath = PUBLIC_PATHS.includes(window.location.pathname);

        if (status === 401 && !isSessionCheck && !onPublicPath) {
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);
export default API;
