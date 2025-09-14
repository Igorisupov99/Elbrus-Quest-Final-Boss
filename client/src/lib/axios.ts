import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStorage';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

type ApiErrorBody = { message?: string; code?: string };
type ExtendedConfig = InternalAxiosRequestConfig & { _retry?: boolean};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorBody>) => {
        const original = error.config as ExtendedConfig;

        if (error.response?.status === 401 && original && !original._retry) {
            original._retry = true;
            try {
                const resp = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = resp.data?.data?.accessToken as string | undefined;
                if (!newToken) throw new Error('No accessToken in refresh response');

                setAccessToken(newToken);

                original.headers = original.headers ?? {};
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            } catch (refreshErr) {
                clearAccessToken();
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            }
        }

        const apiError: ApiErrorBody = {
            message: error.response?.data?.message || 'Произошла ошибка',
            code: String(error.response?.status || ''),
        };
        return Promise.reject(apiError);
    }
);

export default api;