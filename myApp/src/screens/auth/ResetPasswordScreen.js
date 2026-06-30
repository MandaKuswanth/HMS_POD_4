import React, { useState, useRef } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from "react-native";

import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";

import COLORS from "../../utils/colors";

import {
    isEmpty,
} from "../../utils/validators";

import { resetPasswordApi } from "../../api/authService";

export default function ResetPasswordScreen({ navigation, route }) {
    const { email } = route.params || {};

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [passwordReset, setPasswordReset] = useState(false);

    const confirmPasswordRef = useRef(null);

    const updateError = (field, message) => {
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };

    const validatePassword = (password) => {
        if (isEmpty(password)) return "Password is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
        if (!/\d/.test(password)) return "Password must contain at least one number";
        return "";
    };

    const handleNewPasswordChange = (value) => {
        setNewPassword(value);
        if (isEmpty(value)) {
            updateError("newPassword", "");
            return;
        }
        updateError("newPassword", validatePassword(value));
    };

    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);
        if (isEmpty(value)) {
            updateError("confirmPassword", "");
            return;
        }
        if (value !== newPassword) {
            updateError("confirmPassword", "Passwords do not match");
        } else {
            updateError("confirmPassword", "");
        }
    };

    const handleResetPassword = async () => {
        const newPasswordError = validatePassword(newPassword);
        if (newPasswordError) {
            updateError("newPassword", newPasswordError);
            return;
        }

        if (isEmpty(confirmPassword)) {
            updateError("confirmPassword", "Please confirm your password");
            return;
        }

        if (newPassword !== confirmPassword) {
            updateError("confirmPassword", "Passwords do not match");
            return;
        }

        if (!email) {
            Alert.alert("Error", "Email is missing. Please go back and try again.");
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);

            await resetPasswordApi({
                email: email.toLowerCase(),
                newPassword,
                confirmPassword
            });

            setPasswordReset(true);

            setTimeout(() => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }, 2000);

        } catch (error) {
            console.error("Reset Password Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to reset password";
            Alert.alert("Error", errorMessage);
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
                        <View style={styles.header}>
                            <Text style={styles.title}>Set New Password</Text>
                            <Text style={styles.subtitle}>
                                Create a strong password to protect your account
                            </Text>
                        </View>

                        {passwordReset ? (
                            <AppCard style={styles.successCard}>
                                <View style={styles.successContent}>
                                    <Text style={styles.successIcon}>✓</Text>
                                    <Text style={styles.successText}>Password Reset Successfully!</Text>
                                    <Text style={styles.successSubtext}>You can now login with your new password</Text>
                                </View>
                            </AppCard>
                        ) : (
                            <AppCard>
                                <AppInput
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChangeText={handleNewPasswordChange}
                                    secureTextEntry
                                    error={errors.newPassword}
                                    returnKeyType="next"
                                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                                    blurOnSubmit={false}
                                />

                                <View style={styles.requirementsBox}>
                                    <Text style={styles.requirementsTitle}>Password must contain:</Text>
                                    <View style={styles.requirement}>
                                        <Text style={[styles.requirementIcon, newPassword.length >= 8 && styles.requirementDone]}>
                                            {newPassword.length >= 8 ? "✓" : "○"}
                                        </Text>
                                        <Text style={styles.requirementText}>At least 8 characters</Text>
                                    </View>
                                    <View style={styles.requirement}>
                                        <Text style={[styles.requirementIcon, /[A-Z]/.test(newPassword) && styles.requirementDone]}>
                                            {/[A-Z]/.test(newPassword) ? "✓" : "○"}
                                        </Text>
                                        <Text style={styles.requirementText}>At least one uppercase letter</Text>
                                    </View>
                                    <View style={styles.requirement}>
                                        <Text style={[styles.requirementIcon, /\d/.test(newPassword) && styles.requirementDone]}>
                                            {/\d/.test(newPassword) ? "✓" : "○"}
                                        </Text>
                                        <Text style={styles.requirementText}>At least one number</Text>
                                    </View>
                                </View>

                                <AppInput
                                    ref={confirmPasswordRef}
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChangeText={handleConfirmPasswordChange}
                                    secureTextEntry
                                    error={errors.confirmPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleResetPassword}
                                />

                                {confirmPassword && newPassword === confirmPassword && (
                                    <View style={styles.matchBox}>
                                        <Text style={styles.matchIcon}>✓</Text>
                                        <Text style={styles.matchText}>Passwords match</Text>
                                    </View>
                                )}

                                <AppButton
                                    title={loading ? "Resetting..." : "Reset Password"}
                                    onPress={handleResetPassword}
                                    loading={loading}
                                    style={styles.submitButton}
                                />
                            </AppCard>
                        )}

                        <View style={styles.footer}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Text style={styles.footerLink}>← Back</Text>
                            </TouchableOpacity>
                        </View>
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
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.subtitle,
        textAlign: "center",
        lineHeight: 22,
    },
    requirementsBox: {
        backgroundColor: COLORS.successLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 12,
    },
    requirement: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    requirementIcon: {
        fontSize: 16,
        color: COLORS.subtitle,
        marginRight: 10,
        fontWeight: "bold",
    },
    requirementDone: {
        color: COLORS.success,
    },
    requirementText: {
        fontSize: 14,
        color: COLORS.text,
    },
    matchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.successLight,
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    matchIcon: {
        fontSize: 16,
        color: COLORS.success,
        marginRight: 10,
        fontWeight: "bold",
    },
    matchText: {
        fontSize: 14,
        color: COLORS.success,
        fontWeight: "500",
    },
    submitButton: {
        marginTop: 8,
    },
    successCard: {
        backgroundColor: COLORS.successLight,
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    successContent: {
        alignItems: "center",
        paddingVertical: 32,
    },
    successIcon: {
        fontSize: 48,
        color: COLORS.success,
        marginBottom: 16,
    },
    successText: {
        fontSize: 20,
        fontWeight: "bold",
        color: COLORS.success,
        marginBottom: 8,
        textAlign: "center",
    },
    successSubtext: {
        fontSize: 15,
        color: COLORS.text,
        textAlign: "center",
    },
    footer: {
        marginTop: 32,
        alignItems: "center",
    },
    backButton: {
        padding: 8,
    },
    footerLink: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: "600",
    },
});
