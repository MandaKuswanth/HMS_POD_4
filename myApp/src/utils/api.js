import axios from "axios";
import {
    getAccessToken,
    getRefreshToken,
    saveAccessToken,
    saveRefreshToken,
    clearAllAuthData,
} from "./secureStorage";

/*
    BASE URL GUIDE

    Android Emulator with backend on same computer:
    http://10.0.2.2:3000/api

    Physical phone or LAN IP:
    http://10.11.77.115:3000/api

    Web browser:
    http://localhost:3000/api
*/

export const BASE_URL = "http://10.11.80.9:3000/api";
export const AUTH_URL = "http://10.11.80.9:3000/api/v1/auth";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let logoutCallback = null;
let isRefreshing = false;
let refreshSubscribers = [];

export const setLogoutCallback = (callback) => {
    logoutCallback = callback;
};

const onRefreshed = (accessToken) => {
    refreshSubscribers.map((callback) => callback(accessToken));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
    refreshSubscribers.push(callback);
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
                // If the refresh request itself fails, force logout
                if (logoutCallback) {
                    await logoutCallback();
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue the request
                return new Promise((resolve) => {
                    addRefreshSubscriber((accessToken) => {
                        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await getRefreshToken();
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // Call the backend refresh endpoint
                const { data } = await axios.post(
                    `${AUTH_URL}/refresh`,
                    { refreshToken },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                if (data && data.success && data.data && data.data.accessToken) {
                    const newAccessToken = data.data.accessToken;
                    const newRefreshToken = data.data.refreshToken;

                    await saveAccessToken(newAccessToken);
                    if (newRefreshToken) {
                        await saveRefreshToken(newRefreshToken);
                    }

                    isRefreshing = false;
                    onRefreshed(newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                    return api(originalRequest);
                } else {
                    throw new Error("Invalid refresh response");
                }
            } catch (refreshError) {
                isRefreshing = false;
                refreshSubscribers = [];
                await clearAllAuthData();
                if (logoutCallback) {
                    await logoutCallback();
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;