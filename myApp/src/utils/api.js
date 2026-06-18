import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

export const BASE_URL = "http://10.0.2.2:3000/api";

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

export default api;