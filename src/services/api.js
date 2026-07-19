import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://tapaware-production.up.railway.app/api',
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const AUTH_FAILURE_MESSAGES = [
    'Access denied. No token provided',
    'Invalid or expired token.'
];

API.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        const isAuthFailure = status === 401 || (status === 403 && AUTH_FAILURE_MESSAGES.includes(message));

        if (isAuthFailure) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default API;