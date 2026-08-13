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

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        if (status === 401 && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default API;
