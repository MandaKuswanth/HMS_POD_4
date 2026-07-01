import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import SecureStorage from "../utils/secureStorage";

import {
    loginPatient,
    registerPatient,
    refreshTokenApi,
    logoutApi,
} from "../api/authService";

import PropTypes from "prop-types";

import {
    updatePatientApi,
} from "../api/patientService";

const AuthContext = createContext(null);

const decodeJWT = (token) => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;
        return JSON.parse(Buffer.from(parts[1], "base64").toString());
    } catch (err) {
        console.log("JWT decode error:", err);
        return null;
    }
};

const getTokenExpiry = (token) => {
    const decoded = decodeJWT(token);
    return decoded?.exp ? decoded.exp * 1000 : null;
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
        refreshToken: d?.refreshToken || null,
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

    const clearSession = useCallback(async () => {
        await SecureStorage.multiRemove(["token", "refreshToken", "user", "patient", "tokenExpiry"]);
        setToken(null);
        setUser(null);
        setPatient(null);
        setTokenExpiry(null);
    }, []);

    const restoreSession = useCallback(async () => {
        try {
            const [t, rt, u, p, expiryStr] = await SecureStorage.multiGet([
                "token", "refreshToken", "user", "patient", "tokenExpiry"
            ]);

            const storedToken = t[1];
            const storedRefreshToken = rt[1];
            const storedUser = u[1];
            const storedPatient = p[1];
            const storedExpiry = expiryStr[1];

            if (!storedToken || !storedRefreshToken || !storedPatient) {
                return;
            }

            const expiryTime = storedExpiry ? Number.parseInt(storedExpiry) : getTokenExpiry(storedToken);
            const now = Date.now();

            if (expiryTime && now < expiryTime) {
                // Access token still valid
                setToken(storedToken);
                setUser(storedUser ? JSON.parse(storedUser) : null);
                setPatient(normalizePatient(JSON.parse(storedPatient)));
                setTokenExpiry(expiryTime);
            } else {
                // Access token expired — attempt silent refresh
                console.log("Access token expired on restore, trying refresh...");
                try {
                    const refreshed = await refreshTokenApi(storedRefreshToken);
                    const newToken = refreshed?.token;
                    const newRefreshToken = refreshed?.refreshToken;

                    if (!newToken || !newRefreshToken) throw new Error("Empty refresh response");

                    const newExpiry = getTokenExpiry(newToken) ?? (Date.now() + 15 * 60 * 1000);

                    await SecureStorage.multiSet([
                        ["token", newToken],
                        ["refreshToken", newRefreshToken],
                        ["tokenExpiry", newExpiry.toString()],
                    ]);

                    setToken(newToken);
                    setTokenExpiry(newExpiry);
                    setUser(storedUser ? JSON.parse(storedUser) : null);
                    setPatient(normalizePatient(JSON.parse(storedPatient)));
                } catch (refreshErr) {
                    console.log("Silent refresh failed, clearing session:", refreshErr?.message);
                    await clearSession();
                }
            }
        } catch (err) {
            console.log("RESTORE SESSION ERROR:", err);
        } finally {
            setAuthLoading(false);
        }
    }, [clearSession]);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const login = useCallback(async ({ email, password }) => {
        const response = await loginPatient({
            email: email.trim().toLowerCase(),
            password,
        });

        console.log("LOGIN RESPONSE:", response);

        if (response.requiresPasswordReset) {
            const error = new Error("Temporary password reset required");
            error.requiresPasswordReset = true;
            error.email = response.email;
            throw error;
        }

        const data = normalizeLogin(response);
        console.log("TOKEN:", data.token);
        console.log("REFRESH:", data.refreshToken);

        if (!data.token || !data.patient) {
            throw new Error("Invalid login response from server");
        }

        const expiry = getTokenExpiry(data.token) ?? (Date.now() + 15 * 60 * 1000);

        await SecureStorage.multiSet([
            ["token", data.token],
            ["refreshToken", data.refreshToken ?? ""],
            ["tokenExpiry", expiry.toString()],
            ["patient", JSON.stringify(data.patient)],
            ...(data.user ? [["user", JSON.stringify(data.user)]] : []),
        ]);

        if (!data.user) {
            await SecureStorage.removeItem("user");
        }

        setToken(data.token);
        setTokenExpiry(expiry);
        setUser(data.user || null);
        setPatient(data.patient);

        return data;
    }, []);

    const register = useCallback((data) => {
        return registerPatient(data);
    }, []);

    const logout = useCallback(async () => {
        const storedRefreshToken = await SecureStorage.getItem("refreshToken");
        await logoutApi(storedRefreshToken);
        await clearSession();
    }, [clearSession]);

    // Proactively refresh the access token 1 minute before it expires
    useEffect(() => {
        if (!token || !tokenExpiry) return;

        const now = Date.now();
        const timeUntilRefresh = tokenExpiry - now - 60 * 1000; // 1 min before expiry

        if (timeUntilRefresh <= 0) {
            // Already at or past the refresh window — refresh immediately
            SecureStorage.getItem("refreshToken").then(async (rt) => {
                if (!rt) { logout(); return; }
                try {
                    const refreshed = await refreshTokenApi(rt);
                    const newToken = refreshed?.token;
                    const newRefreshToken = refreshed?.refreshToken;
                    if (!newToken || !newRefreshToken) throw new Error("Empty refresh");

                    const newExpiry = getTokenExpiry(newToken) ?? (Date.now() + 15 * 60 * 1000);
                    await SecureStorage.multiSet([
                        ["token", newToken],
                        ["refreshToken", newRefreshToken],
                        ["tokenExpiry", newExpiry.toString()],
                    ]);
                    setToken(newToken);
                    setTokenExpiry(newExpiry);
                } catch (err) {
                    console.log("Proactive refresh failed:", err?.message);
                    logout();
                }
            });
            return;
        }

        const timeoutId = setTimeout(async () => {
            const rt = await SecureStorage.getItem("refreshToken");
            if (!rt) { logout(); return; }
            try {
                const refreshed = await refreshTokenApi(rt);
                const newToken = refreshed?.token;
                const newRefreshToken = refreshed?.refreshToken;
                if (!newToken || !newRefreshToken) throw new Error("Empty refresh");

                const newExpiry = getTokenExpiry(newToken) ?? (Date.now() + 15 * 60 * 1000);
                await SecureStorage.multiSet([
                    ["token", newToken],
                    ["refreshToken", newRefreshToken],
                    ["tokenExpiry", newExpiry.toString()],
                ]);
                setToken(newToken);
                setTokenExpiry(newExpiry);
            } catch (err) {
                console.log("Proactive refresh failed:", err?.message);
                logout();
            }
        }, timeUntilRefresh);

        return () => clearTimeout(timeoutId);
    }, [token, tokenExpiry, logout]);

    const updatePatientState = useCallback(async (p) => {
        const n = normalizePatient(p);

        if (!n) {
            await SecureStorage.removeItem("patient");
            setPatient(null);
            return;
        }

        setPatient(n);

        await SecureStorage.setItem(
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

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};