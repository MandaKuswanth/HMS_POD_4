import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    loginPatient,
    registerPatient,
} from "../api/authService";

import {
    updatePatientApi,
} from "../api/patientService";

const AuthContext = createContext(null);

// JWT Timeout duration in milliseconds (15 minutes)
const JWT_TIMEOUT_DURATION = 15 * 60 * 1000;

// Decode JWT to get expiration time
const decodeJWT = (token) => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        
        const decoded = JSON.parse(
            Buffer.from(parts[1], "base64").toString()
        );
        return decoded;
    } catch (err) {
        console.log("JWT decode error:", err);
        return null;
    }
};

// Check if token is expired based on custom timeout
const isCustomTokenExpired = (expiryTime) => {
    if (!expiryTime) return false;
    const currentTime = Date.now();
    return currentTime > expiryTime;
};

const normalizePatient = (p) => {
    console.log(p);
    if (!p) return null;

    return {
        ...p,
        address:
            typeof p.address === "object" && p.address !== null
                ? p.address
                : {
                    street: p.address || "",
                    city: "",
                    state: "",
                    pincode: "",
                },
    };
};

const normalizeLogin = (payload) => {
    console.log(payload);
    const d = payload?.data || payload;

    return {
        token: d?.token || null,
        user: d?.user || null,
        patient: normalizePatient(d?.patient),
    };
};

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [tokenExpiry, setTokenExpiry] = useState(null);

    const restoreSession = useCallback(async () => {
        try {
            const t = await AsyncStorage.getItem("token");
            const u = await AsyncStorage.getItem("user");
            const p = await AsyncStorage.getItem("patient");
            const expiryTime = await AsyncStorage.getItem("tokenExpiry");

            if (t && p && expiryTime) {
                // Check if custom token timeout has expired
                const expiryTimeNum = parseInt(expiryTime);
                if (isCustomTokenExpired(expiryTimeNum)) {
                    console.log("Token has timed out, clearing session");
                    await AsyncStorage.multiRemove([
                        "token",
                        "user",
                        "patient",
                        "tokenExpiry",
                    ]);
                    setToken(null);
                    setUser(null);
                    setPatient(null);
                    setTokenExpiry(null);
                } else {
                    console.log("Token is still valid, restoring session");
                    setToken(t);
                    setUser(u ? JSON.parse(u) : null);
                    setPatient(normalizePatient(JSON.parse(p)));
                    setTokenExpiry(expiryTimeNum);
                }
            }
        } catch (err) {
            console.log("RESTORE SESSION ERROR:", err);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const login = useCallback(async ({ email, password }) => {
        const data = normalizeLogin(
            await loginPatient({
                email: email.trim().toLowerCase(),
                password,
            })
        );

        console.log("LOGIN DATA:", data);

        if (!data.token || !data.patient) {
            throw new Error("Invalid login response from server");
        }

        // Calculate token expiry time
        const expiryTime = Date.now() + JWT_TIMEOUT_DURATION;

        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("tokenExpiry", expiryTime.toString());

        if (data.user) {
            await AsyncStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );
        } else {
            await AsyncStorage.removeItem("user");
        }

        await AsyncStorage.setItem(
            "patient",
            JSON.stringify(data.patient)
        );

        setToken(data.token);
        setTokenExpiry(expiryTime);
        setUser(data.user || null);
        setPatient(data.patient);

        return data;
    }, []);

    const register = useCallback((data) => {
        return registerPatient(data);
    }, []);

    const logout = useCallback(async () => {
        await AsyncStorage.multiRemove([
            "token",
            "user",
            "patient",
            "tokenExpiry",
        ]);

        setToken(null);
        setUser(null);
        setPatient(null);
        setTokenExpiry(null);
    }, []);

    // Monitor token expiration and auto-logout
    useEffect(() => {
        if (!token || !tokenExpiry) return;

        const now = Date.now();
        const timeUntilExpiry = tokenExpiry - now;

        if (timeUntilExpiry <= 0) {
            // Token already expired
            logout();
            return;
        }

        // Set timeout to logout when token expires
        const timeoutId = setTimeout(() => {
            console.log("Token expired, logging out...");
            logout();
        }, timeUntilExpiry);

        return () => clearTimeout(timeoutId);
    }, [token, tokenExpiry, logout]);

    const updatePatientState = useCallback(async (p) => {
        const n = normalizePatient(p);

        if (!n) {
            await AsyncStorage.removeItem("patient");
            setPatient(null);
            return;
        }

        setPatient(n);

        await AsyncStorage.setItem(
            "patient",
            JSON.stringify(n)
        );
    }, []);

    const updateProfile = useCallback(async (data) => {
        if (!patient?.UHID) {
            throw new Error("Patient UHID missing");
        }

        const updated = await updatePatientApi(
            patient.UHID,
            data
        );

        const finalPatient = normalizePatient(
            updated?.patient || updated
        );

        await updatePatientState(finalPatient);

        return finalPatient;
    }, [patient, updatePatientState]);

    const value = useMemo(() => ({
        token,
        user,
        patient,
        tokenExpiry,
        isLoggedIn: !!token,
        authLoading,
        login,
        register,
        logout,
        updateProfile,
        updatePatientState,
    }), [
        token,
        user,
        patient,
        tokenExpiry,
        authLoading,
        login,
        register,
        logout,
        updateProfile,
        updatePatientState,
    ]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const v = useContext(AuthContext);

    if (!v) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return v;
};