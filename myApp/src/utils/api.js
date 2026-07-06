import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";


export const BASE_URL = "https://10.11.67.99:3000/api";

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
           
     

                processQueue(null, newToken);
                isRefreshing = false;

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

           
                await AsyncStorage.multiRemove(["token", "refreshToken", "user", "patient", "tokenExpiry"]);

                throw refreshError;
            }
        }

        throw error;
    }
);

export default api;
