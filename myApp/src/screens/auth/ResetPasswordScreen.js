import React, { useState } from "react";

import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from "react-native";

import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";

import COLORS from "../../utils/colors";

import {
    isEmpty,
    firstErrorMessage,
} from "../../utils/validators";

import { resetPasswordApi } from "../../api/authService";

export default function ResetPasswordScreen({ navigation, route }) {
    const { email, verificationToken } = route.params || {};

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState({
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);
    const [passwordReset, setPasswordReset] = useState(false);

    const updateError = (field, message) => {
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };

    const validatePassword = (password) => {
        if (isEmpty(password)) {
            return "Password is required";
        }

        if (password.length < 8) {
            return "Password must be at least 8 characters";
        }

        if (!/[A-Z]/.test(password)) {
            return "Password must contain at least one uppercase letter";
        }

        if (!/\d/.test(password)) {
            return "Password must contain at least one number";
        }

        return "";
    };

    const handleNewPasswordChange = (value) => {
        setNewPassword(value);

        if (isEmpty(value)) {
            updateError("newPassword", "");
            return;
        }

        const error = validatePassword(value);
        updateError("newPassword", error);
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
        // Validate new password
        const newPasswordError = validatePassword(newPassword);
        if (newPasswordError) {
            updateError("newPassword", newPasswordError);
            Alert.alert("Validation Error", newPasswordError);
            return;
        }

        // Validate confirm password
        if (isEmpty(confirmPassword)) {
            updateError("confirmPassword", "Please confirm your password");
            Alert.alert("Validation Error", "Please confirm your password");
            return;
        }

        if (newPassword !== confirmPassword) {
            updateError("confirmPassword", "Passwords do not match");
            Alert.alert("Validation Error", "Passwords do not match");
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

            // Show success and navigate to login after 2 seconds
            Alert.alert("Success", "Password reset successfully!");
            setTimeout(() => {
                navigation.navigate("Login");
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
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Set New Password</Text>
                        <Text style={styles.subtitle}>
                            Create a strong password to protect your account
                        </Text>
                    </View>

                    {/* Success Message */}
                    {passwordReset && (
                        <AppCard style={styles.successCard}>
                            <View style={styles.successContent}>
                                <Text style={styles.successIcon}>✓</Text>
                                <Text style={styles.successText}>
                                    Password Reset Successfully!
                                </Text>
                                <Text style={styles.successSubtext}>
                                    You can now login with your new password
                                </Text>
                            </View>
                        </AppCard>
                    )}

                    {/* Form */}
                    {!passwordReset && (
                        <AppCard style={styles.formCard}>
                            <View style={styles.formContent}>
                                {/* New Password Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={[
                                        styles.passwordInputWrapper,
                                        errors.newPassword && styles.inputWrapperError
                                    ]}>
                                        <AppInput
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            onChangeText={handleNewPasswordChange}
                                            secureTextEntry={!showPassword}
                                            editable={!loading}
                                            style={styles.input}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeIcon}
                                        >
                                            <Text style={styles.eyeIconText}>
                                                {showPassword ? "👁" : "👁‍🗨"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errors.newPassword ? (
                                        <Text style={styles.errorText}>
                                            {errors.newPassword}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Password Requirements */}
                                <View style={styles.requirementsBox}>
                                    <Text style={styles.requirementsTitle}>Password must contain:</Text>
                                    <View style={styles.requirement}>
                                        <Text style={[
                                            styles.requirementIcon,
                                            newPassword.length >= 8 && styles.requirementDone
                                        ]}>
                                            {newPassword.length >= 8 ? "✓" : "○"}
                                        </Text>
                                        <Text style={styles.requirementText}>At least 8 characters</Text>
                                    </View>
                                    <View style={styles.requirement}>
                                        <Text style={[
                                            styles.requirementIcon,
                                            /[A-Z]/.test(newPassword) && styles.requirementDone
                                        ]}>
                                            {/[A-Z]/.test(newPassword) ? "✓" : "○"}
                                        </Text>
                                        <Text style={styles.requirementText}>At least one uppercase letter</Text>
                                    </View>
                                    <View style={styles.requirement}>
                                        <Text style={[
                                            styles.requirementIcon,
                                            /\d/.test(newPassword) && styles.requirementDone
                                        ]}>
                                            {/\d/.test(newPassword) ? "✓" : "○"}
                                        </Text>
                                        <Text style={styles.requirementText}>At least one number</Text>
                                    </View>
                                </View>

                                {/* Confirm Password Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={[
                                        styles.passwordInputWrapper,
                                        errors.confirmPassword && styles.inputWrapperError
                                    ]}>
                                        <AppInput
                                            placeholder="Confirm your password"
                                            value={confirmPassword}
                                            onChangeText={handleConfirmPasswordChange}
                                            secureTextEntry={!showConfirmPassword}
                                            editable={!loading}
                                            style={styles.input}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            style={styles.eyeIcon}
                                        >
                                            <Text style={styles.eyeIconText}>
                                                {showConfirmPassword ? "👁" : "👁‍🗨"}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {errors.confirmPassword ? (
                                        <Text style={styles.errorText}>
                                            {errors.confirmPassword}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Match Indicator */}
                                {confirmPassword && newPassword === confirmPassword && (
                                    <View style={styles.matchBox}>
                                        <Text style={styles.matchIcon}>✓</Text>
                                        <Text style={styles.matchText}>Passwords match</Text>
                                    </View>
                                )}

                                {/* Reset Button */}
                                <AppButton
                                    title={loading ? "Resetting Password..." : "Reset Password"}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                    style={styles.submitButton}
                                />
                            </View>
                        </AppCard>
                    )}

                    {/* Back Link */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>← Back</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },
    header: {
        marginBottom: 30,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.dark,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 21,
    },
    formCard: {
        marginBottom: 20,
        paddingVertical: 25,
    },
    formContent: {
        paddingHorizontal: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.dark,
        marginBottom: 8,
    },
    passwordInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: 8,
        paddingRight: 10,
        backgroundColor: "#FAFAFA",
    },
    inputWrapperError: {
        borderColor: COLORS.danger,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.dark,
        backgroundColor: "transparent",
    },
    eyeIcon: {
        padding: 8,
    },
    eyeIconText: {
        fontSize: 18,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 5,
    },
    requirementsBox: {
        backgroundColor: "#F0F8E8",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
    },
    requirementsTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.dark,
        marginBottom: 8,
    },
    requirement: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    requirementIcon: {
        fontSize: 18,
        color: COLORS.gray,
        marginRight: 10,
        fontWeight: "bold",
    },
    requirementDone: {
        color: COLORS.success,
    },
    requirementText: {
        fontSize: 13,
        color: COLORS.dark,
    },
    matchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F8F0",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
    },
    matchIcon: {
        fontSize: 18,
        color: COLORS.success,
        marginRight: 10,
        fontWeight: "bold",
    },
    matchText: {
        fontSize: 13,
        color: COLORS.success,
        fontWeight: "500",
    },
    submitButton: {
        marginTop: 10,
    },
    successCard: {
        marginBottom: 20,
        backgroundColor: "#E8F8F0",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
    },
    successContent: {
        alignItems: "center",
        paddingVertical: 30,
    },
    successIcon: {
        fontSize: 50,
        color: COLORS.success,
        marginBottom: 15,
    },
    successText: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.success,
        marginBottom: 5,
        textAlign: "center",
    },
    successSubtext: {
        fontSize: 14,
        color: COLORS.gray,
        textAlign: "center",
    },
    footer: {
        marginTop: 20,
    },
    footerLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
    },
});
