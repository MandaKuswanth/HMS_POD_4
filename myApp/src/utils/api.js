import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

/*
    BASE URL GUIDE

    Android Emulator with backend on same computer:
    http://10.0.2.2:3000/api

    Physical phone or LAN IP:
    http://10.11.77.115:3000/api

    Web browser:
    http://localhost:3000/api
*/

export const BASE_URL = "http://10.11.67.99:3000/api";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem("token");

        if (token) {
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

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request until the current refresh finishes
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem("refreshToken");

                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                const { data } = await axios.post(`${BASE_URL}/patient-auth/refresh-token`, { refreshToken });
                const newToken = data?.data?.token;
                const newRefreshToken = data?.data?.refreshToken;

                // await AsyncStorage.setItem("token", newToken);
                // await AsyncStorage.setItem("refreshToken", newRefreshToken);

                processQueue(null, newToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                // Refresh failed — clear all auth data so AuthContext detects logout
                await AsyncStorage.multiRemove(["token", "refreshToken", "user", "patient", "tokenExpiry"]);

                throw refreshError;
            }
        }

        throw error;
    }
);

export default api;
