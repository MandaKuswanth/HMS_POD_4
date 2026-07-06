import React, { useState } from "react";

import {
    Alert,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppCard from "../../components/AppCard";
import AppButton from "../../components/AppButton";
import AuthBackLink from "../../components/auth/AuthBackLink";
import AuthScreenHeader from "../../components/auth/AuthScreenHeader";
import AuthScreenLayout from "../../components/auth/AuthScreenLayout";
import AuthStatusCard from "../../components/auth/AuthStatusCard";
import PasswordInputField from "../../components/auth/PasswordInputField";
import PasswordRequirements from "../../components/auth/PasswordRequirements";

import COLORS from "../../utils/colors";
import { createErrorUpdater } from "../../utils/formErrors";

import {
    isEmpty,
} from "../../utils/validators";

import { resetPasswordApi } from "../../api/authService";
import PropTypes from "prop-types";

export default function ResetPasswordScreen({ navigation, route }) {
    const { email } = route.params || {};

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

    const updateError = createErrorUpdater(setErrors);

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

        updateError("newPassword", validatePassword(value));
    };

    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);

        if (isEmpty(value)) {
            updateError("confirmPassword", "");
            return;
        }

        updateError(
            "confirmPassword",
            value === newPassword ? "" : "Passwords do not match"
        );
    };

    const handleResetPassword = async () => {
        const newPasswordError = validatePassword(newPassword);

        if (newPasswordError) {
            updateError("newPassword", newPasswordError);
            Alert.alert("Validation Error", newPasswordError);
            return;
        }

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
            Alert.alert(
                "Error",
                "Email is missing. Please go back and try again."
            );
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);

            await resetPasswordApi({
                email: email.toLowerCase(),
                newPassword,
                confirmPassword,
            });

            setPasswordReset(true);

            Alert.alert("Success", "Password reset successfully!");
            setTimeout(() => {
                navigation.navigate("Login");
            }, 2000);
        } catch (error) {
            console.error("Reset Password Error:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to reset password";

            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScreenLayout>
            <AuthScreenHeader
                title="Set New Password"
                subtitle="Create a strong password to protect your account"
            />

            {passwordReset ? (
                <AuthStatusCard
                    title="Password Reset Successfully!"
                    subtitle="You can now login with your new password"
                    contentStyle={styles.successContent}
                />
            ) : (
                <AppCard style={styles.formCard}>
                    <View style={styles.formContent}>
                        <PasswordInputField
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChangeText={handleNewPasswordChange}
                            secureTextEntry={!showPassword}
                            onToggleVisibility={() =>
                                setShowPassword(!showPassword)
                            }
                            editable={!loading}
                            error={errors.newPassword}
                        />

                        <PasswordRequirements password={newPassword} />

                        <PasswordInputField
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            secureTextEntry={!showConfirmPassword}
                            onToggleVisibility={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            editable={!loading}
                            error={errors.confirmPassword}
                        />

                        {confirmPassword && newPassword === confirmPassword ? (
                            <View style={styles.matchBox}>
                                <Text style={styles.matchIcon}>OK</Text>
                                <Text style={styles.matchText}>
                                    Passwords match
                                </Text>
                            </View>
                        ) : null}

                        <AppButton
                            title={
                                loading
                                    ? "Resetting Password..."
                                    : "Reset Password"
                            }
                            onPress={handleResetPassword}
                            disabled={loading}
                            style={styles.submitButton}
                        />
                    </View>
                </AppCard>
            )}

            <AuthBackLink onPress={() => navigation.goBack()} />
        </AuthScreenLayout>
    );
}

const styles = StyleSheet.create({
    formCard: {
        marginBottom: 20,
        paddingVertical: 25,
    },

    formContent: {
        paddingHorizontal: 5,
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
        fontSize: 12,
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

    successContent: {
        paddingVertical: 30,
    },
});

ResetPasswordScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
};
