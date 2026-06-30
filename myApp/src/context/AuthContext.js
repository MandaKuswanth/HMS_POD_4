import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { setLogoutCallback } from "../utils/api";
import {
    saveAccessToken,
    saveRefreshToken,
    saveUserData,
    getAccessToken,
    getUserData,
    clearAllAuthData,
} from "../utils/secureStorage";

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
        token: d?.accessToken || d?.token || null,
        refreshToken: d?.refreshToken || null,
        user: d?.user || null,
        patient: normalizePatient(d?.patient || (d?.user?.isEmployee ? null : d?.user)),
    };
};

export function AuthProvider({ children }) {
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const [patient, setPatient] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const restoreSession = useCallback(async () => {
        try {
            const t = await getAccessToken();
            const storedData = await getUserData();

            if (t && storedData) {
                setToken(t);
                setUser(storedData.user || null);
                setPatient(normalizePatient(storedData.patient));
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

    useEffect(() => {
        setLogoutCallback(logout);
        return () => {
            setLogoutCallback(null);
        };
    }, [logout]);

    const login = useCallback(async ({ email, password }) => {
        const rawData = await loginPatient({
            email: email.trim().toLowerCase(),
            password,
        });
        const data = normalizeLogin(rawData);

        console.log("LOGIN DATA parsed:", data);

        if (!data.token) {
            throw new Error("Invalid login response from server");
        }

        await saveAccessToken(data.token);
        
        if (data.refreshToken) {
            await saveRefreshToken(data.refreshToken);
        }

        const userDataToStore = {
            user: data.user,
            patient: data.patient
        };
        await saveUserData(userDataToStore);

        setToken(data.token);
        setUser(data.user || null);
        setPatient(data.patient);

        return data;
    }, []);

    const register = useCallback((data) => {
        return registerPatient(data);
    }, []);

    const logout = useCallback(async () => {
        await clearAllAuthData();

        setToken(null);
        setUser(null);
        setPatient(null);
    }, []);

    const updatePatientState = useCallback(async (p) => {
        const n = normalizePatient(p);

        if (!n) {
            await saveUserData({ user, patient: null });
            setPatient(null);
            return;
        }

        setPatient(n);
        await saveUserData({ user, patient: n });
    }, [user]);

    const updateProfile = useCallback(async (data) => {
        const uhid = patient?.UHID || user?.UHID;
        if (!uhid) {
            throw new Error("Patient UHID missing");
        }

        const updated = await updatePatientApi(
            uhid,
            data
        );

        const finalPatient = normalizePatient(
            updated?.patient || updated
        );

        await updatePatientState(finalPatient);

        return finalPatient;
    }, [patient, user, updatePatientState]);

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