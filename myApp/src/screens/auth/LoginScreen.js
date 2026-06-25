import React, { useState } from "react";

import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";

import COLORS from "../../utils/colors";

import { useAuth } from "../../context/AuthContext";

import {
    isEmpty,
    isValidEmail,
    validateLoginSubmit,
    firstErrorMessage,
} from "../../utils/validators";

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const updateError = (field, message) => {
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };

    const handleEmailChange = (value) => {
        setEmail(value);

        if (isEmpty(value)) {
            updateError("email", "");
            return;
        }

        updateError(
            "email",
            isValidEmail(value)
                ? ""
                : "Please enter a valid email address"
        );
    };

    const handlePasswordChange = (value) => {
        setPassword(value);

        if (isEmpty(value)) {
            updateError("password", "");
            return;
        }

        updateError("password", "");
    };

    const handleLogin = async () => {
        const submitErrors = validateLoginSubmit({
            email,
            password,
        });

        setErrors((prev) => ({
            ...prev,
            ...submitErrors,
        }));

        const message = firstErrorMessage(submitErrors);

        if (message) {
            Alert.alert("Validation Error", message);
            return;
        }

        try {
            setLoading(true);

            await login({
                email,
                password,
            });
        } catch (error) {
            // ✅ NEW: Check if temporary password reset is required
            if (error.requiresPasswordReset) {
                navigation.navigate("ForceResetPassword", {
                    email: error.email,
                });
                return;
            }

            Alert.alert(
                "Login Failed",
                error?.response?.data?.message ||
                error?.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <View style={styles.wrapper}>
                <AppCard>
                    <Text style={styles.logo}>🏥</Text>

                    <Text style={styles.title}>
                        Welcome Back
                    </Text>

                    <Text style={styles.subtitle}>
                        Sign in to continue
                    </Text>

                    <AppInput
                        placeholder="Email"
                        value={email}
                        onChangeText={handleEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <AppInput
                        placeholder="Password"
                        value={password}
                        onChangeText={handlePasswordChange}
                        secureTextEntry
                        error={errors.password}
                    />

                    <AppButton
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        disabled={loading}
                    />

                    {/* ✅ NEW: Forgot Password Link */}
                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate("ForgotPassword")
                        }
                    >
                        <Text style={styles.forgotPasswordLink}>
                            Forgot Password?
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            navigation.navigate("Register")
                        }
                    >
                        <Text style={styles.link}>
                            Don't have an account? Register
                        </Text>
                    </TouchableOpacity>
                </AppCard>
            </View>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },

    logo: {
        fontSize: 60,
        textAlign: "center",
        marginBottom: 12,
    },

    title: {
        fontSize: 30,
        fontWeight: "900",
        textAlign: "center",
        color: COLORS.text,
    },

    subtitle: {
        textAlign: "center",
        color: COLORS.subtitle,
        marginBottom: 24,
        marginTop: 6,
    },

    link: {
        marginTop: 20,
        textAlign: "center",
        color: COLORS.primary,
        fontWeight: "800",
    },

    // ✅ NEW: Forgot Password Link Style
    forgotPasswordLink: {
        marginTop: 15,
        textAlign: "center",
        color: COLORS.primary,
        fontWeight: "600",
        fontSize: 14,
    },
});