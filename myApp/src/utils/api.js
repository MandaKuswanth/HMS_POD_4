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

export const BASE_URL = "http://10.11.71.59:3000/api";

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