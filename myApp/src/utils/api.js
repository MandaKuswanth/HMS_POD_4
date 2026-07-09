import axios from "axios";

import SecureStorage from "./secureStorage";

export const BASE_URL = "https://13.202.52.104/api";

let accessToken = null;

export const setApiAccessToken = (token) => {
    accessToken = token || null;
};

export const clearApiAccessToken = () => {
    accessToken = null;
};

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

const isAuthEndpoint = (url = "") => {
    return url.includes("/patient-auth/login") ||
        url.includes("/patient-auth/register") ||
        url.includes("/patient-auth/refresh-token") ||
        url.includes("/patient-auth/forgot-password") ||
        url.includes("/patient-auth/verify-otp") ||
        url.includes("/patient-auth/reset-password") ||
        url.includes("/patient-auth/reset-temporary-password") ||
        url.includes("/patient-auth/logout");
};

api.interceptors.request.use(
    async (config) => {
        const token = accessToken || await SecureStorage.getItem("token");

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Track whether a refresh is already in progress to avoid parallel refresh calls
let isRefreshing = false;
let pendingQueue = [];

const processQueue = (error, token = null) => {
    pendingQueue.forEach((p) => {
        if (error) {
            p.reject(error);
        } else {
            p.resolve(token);
        }
    });
    pendingQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint(originalRequest.url)
        ) {
            if (isRefreshing) {
                // Queue this request until the current refresh finishes
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStorage.getItem("refreshToken");

                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                const { data } = await axios.post(
                    `${BASE_URL}/patient-auth/refresh-token`,
                    { refreshToken }
                );
                const newToken = data?.data?.token || data?.token;
                const newRefreshToken =
                    data?.data?.refreshToken ||
                    data?.refreshToken ||
                    refreshToken;

                if (!newToken) {
                    throw new Error("Refresh response missing token");
                }

                await SecureStorage.multiSet([
                    ["token", newToken],
                    ["refreshToken", newRefreshToken],
                ]);
                setApiAccessToken(newToken);

                processQueue(null, newToken);
                isRefreshing = false;

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                await SecureStorage.multiRemove([
                    "token",
                    "refreshToken",
                    "user",
                    "patient",
                    "tokenExpiry",
                ]);
                clearApiAccessToken();

                throw refreshError;
            }
        }

        throw error;
    }
);

export default api;
