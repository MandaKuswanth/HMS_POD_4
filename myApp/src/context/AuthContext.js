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

const normalizePatient = (p) => {
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

    const restoreSession = useCallback(async () => {
        try {
            const t = await AsyncStorage.getItem("token");
            const u = await AsyncStorage.getItem("user");
            const p = await AsyncStorage.getItem("patient");

            if (t && p) {
                setToken(t);
                setUser(u ? JSON.parse(u) : null);
                setPatient(normalizePatient(JSON.parse(p)));
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

        await AsyncStorage.setItem("token", data.token);

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
        ]);

        setToken(null);
        setUser(null);
        setPatient(null);
    }, []);

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