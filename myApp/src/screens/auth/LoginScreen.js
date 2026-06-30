import React, { useState, useRef } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView
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
    const passwordRef = useRef(null);

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
        updateError("email", isValidEmail(value) ? "" : "Please enter a valid email address");
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
        updateError("password", "");
    };

    const handleLogin = async () => {
        const submitErrors = validateLoginSubmit({ email, password });
        setErrors((prev) => ({ ...prev, ...submitErrors }));

        const message = firstErrorMessage(submitErrors);
        if (message) {
            Alert.alert("Validation Error", message);
            return;
        }

        try {
            setLoading(true);
            await login({ email, password });
        } catch (error) {
            Alert.alert(
                "Login Failed",
                error?.response?.data?.message || error?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <AppCard style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.logo}>🏥</Text>
                                <Text style={styles.title}>Welcome Back</Text>
                                <Text style={styles.subtitle}>Sign in to continue</Text>
                            </View>

                            <AppInput
                                placeholder="Email Address"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={errors.email}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                blurOnSubmit={false}
                            />

                            <AppInput
                                ref={passwordRef}
                                placeholder="Password"
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry
                                error={errors.password}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />

                            <View style={styles.forgotPasswordContainer}>
                                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>

                            <AppButton
                                title="Login"
                                onPress={handleLogin}
                                loading={loading}
                                style={styles.loginButton}
                            />

                            <View style={styles.registerContainer}>
                                <Text style={styles.registerText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                                    <Text style={styles.registerLink}>Register</Text>
                                </TouchableOpacity>
                            </View>
                        </AppCard>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: "center",
    },
    card: {
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    logo: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.subtitle,
    },
    forgotPasswordContainer: {
        alignItems: "flex-end",
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "600",
    },
    loginButton: {
        marginBottom: 24,
    },
    registerContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    registerText: {
        color: COLORS.subtitle,
        fontSize: 15,
    },
    registerLink: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: "bold",
    },
});