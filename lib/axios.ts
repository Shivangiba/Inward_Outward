import axios from 'axios';
import { getCookie } from 'cookies-next';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = getCookie('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // If 401 Unauthorized, redirect to login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
