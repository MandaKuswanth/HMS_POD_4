import axios from "axios";
import { Alert } from "react-native";
import { Platform } from "react-native";

import { getItem, removeItem } from "../utils/storage";
import { resetToLogin } from "../navigation/navigationRef";




const baseURL = "http://localhost:5000/api";


const axiosInstance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to every request
axiosInstance.interceptors.request.use(
    async (config) => {
        const token = await getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired token
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (
            status === 401 &&
            (
                message === "jwt expired" ||
                message === "Invalid token" ||
                message === "No token provided"
            )
        ) {
            await removeItem("token");
            await removeItem("user");
            await removeItem("patientData");

            Alert.alert("Session Expired", "Please login again.");

            resetToLogin();
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;