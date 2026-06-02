import React, { useState, useEffect, createContext } from "react";
import { Alert } from "react-native";

import { getItem, setItem, removeItem } from "../utils/storage";

import {
    loginPatient as loginApi,
    registerPatient as registerApi,
    getPatientProfile as getProfileApi,
} from "../api/authApi";

export const AuthContext = createContext();

const safeParse = (value) => {
    try {
        if (!value) return null;
        return typeof value === "string" ? JSON.parse(value) : value;
    } catch (error) {
        console.log("JSON parse error:", error);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkLoginStatus();
    }, []);

    const checkLoginStatus = async () => {
        try {
            const storedToken = await getItem("token");
            const storedUser = await getItem("user");
            const storedPatient = await getItem("patientData");

            if (storedToken) {
                setToken(storedToken);
            }

            if (storedUser) {
                setUser(safeParse(storedUser));
            }

            if (storedPatient) {
                setPatientData(safeParse(storedPatient));
            }
        } catch (error) {
            console.log("Error checking login status:", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);

        try {
            const response = await loginApi({
                email,
                password,
            });

            console.log("Login API Response:", response);

            const responseData = response?.data || response;

            const loginToken = responseData?.token;
            const loginUser = responseData?.user;
            const loginPatientData =
                responseData?.patientData || responseData?.patient;

            if (!loginToken) {
                Alert.alert("Login Error", "Token not found in response");

                return {
                    success: false,
                    message: "Token not found in response",
                };
            }

            setToken(loginToken);
            setUser(loginUser);
            setPatientData(loginPatientData);

            await setItem("token", loginToken);
            await setItem("user", JSON.stringify(loginUser));

            if (loginPatientData) {
                await setItem("patientData", JSON.stringify(loginPatientData));
            }

            return {
                success: true,
                data: responseData,
            };
        } catch (error) {
            console.log("Error logging in:", error.response?.data || error.message);

            const message =
                error.response?.data?.message || "Login failed. Please try again.";

            Alert.alert("Login Error", message);

            return {
                success: false,
                message,
            };
        } finally {
            setLoading(false);
        }
    };

    const register = async (data) => {
        setLoading(true);

        try {
            const response = await registerApi(data);

            console.log("Register API Response:", response);

            return {
                success: true,
                data: response,
            };
        } catch (error) {
            console.log("Error registering:", error.response?.data || error.message);

            const message =
                error.response?.data?.message ||
                "Registration failed. Please try again.";

            Alert.alert("Registration Error", message);

            return {
                success: false,
                message,
            };
        } finally {
            setLoading(false);
        }
    };

    const getProfile = async () => {
        setLoading(true);

        try {
            const response = await getProfileApi();

            console.log("Profile API Response:", response);

            const profile = response?.data || response;

            setPatientData(profile);
            await setItem("patientData", JSON.stringify(profile));

            return {
                success: true,
                data: profile,
            };
        } catch (error) {
            console.log("Get profile error:", error.response?.data || error.message);

            const message =
                error.response?.data?.message || "Failed to fetch profile";

            Alert.alert("Profile Error", message);

            return {
                success: false,
                message,
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);

        try {
            await removeItem("token");
            await removeItem("user");
            await removeItem("patientData");

            setToken(null);
            setUser(null);
            setPatientData(null);
        } catch (error) {
            console.log("Error logging out:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                patientData,
                token,
                loading,
                login,
                register,
                getProfile,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};