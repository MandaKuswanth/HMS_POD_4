import React, { useState } from "react";

import {
    Alert,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppCard from "../../components/AppCard";
import AppInput from "../../components/AppInput";
import AppButton from "../../components/AppButton";
import AuthBackLink from "../../components/auth/AuthBackLink";
import AuthNoticeBox from "../../components/auth/AuthNoticeBox";
import AuthScreenHeader from "../../components/auth/AuthScreenHeader";
import AuthScreenLayout from "../../components/auth/AuthScreenLayout";
import AuthStatusCard from "../../components/auth/AuthStatusCard";

import COLORS from "../../utils/colors";
import { createErrorUpdater } from "../../utils/formErrors";

import {
    isEmpty,
    isValidEmail,
} from "../../utils/validators";

import { forgotPasswordApi } from "../../api/authService";
import PropTypes from "prop-types";

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({ email: "" });
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const updateError = createErrorUpdater(setErrors);

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

    const handleForgotPassword = async () => {
        if (isEmpty(email)) {
            updateError("email", "Email is required");
            Alert.alert("Validation Error", "Email is required");
            return;
        }

        if (!isValidEmail(email)) {
            updateError("email", "Please enter a valid email address");
            Alert.alert(
                "Validation Error",
                "Please enter a valid email address"
            );
            return;
        }

        try {
            setLoading(true);

            const normalizedEmail = email.trim().toLowerCase();
            await forgotPasswordApi({ email: normalizedEmail });

            setEmailSent(true);

            setTimeout(() => {
                navigation.navigate("OTPVerification", {
                    email: normalizedEmail,
                });
            }, 2000);
        } catch (error) {
            console.error("Forgot Password Error:", error);
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "An error occurred";

            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScreenLayout>
            <AuthScreenHeader
                title="Forgot Password?"
                subtitle="Enter your email address and we'll send you an OTP to reset your password."
            />

            {emailSent ? (
                <AuthStatusCard
                    title="OTP sent successfully!"
                    subtitle="Check your email for the OTP"
                />
            ) : (
                <AppCard style={styles.formCard}>
                    <View style={styles.formContent}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Email Address
                            </Text>
                            <AppInput
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                editable={!loading}
                                style={[
                                    styles.input,
                                    errors.email && styles.inputError,
                                ]}
                            />
                            {errors.email ? (
                                <Text style={styles.errorText}>
                                    {errors.email}
                                </Text>
                            ) : null}
                        </View>

                        <AuthNoticeBox>
                            We'll send a 6-digit OTP to your email. The OTP will be valid for 10 minutes.
                        </AuthNoticeBox>

                        <AppButton
                            title={loading ? "Sending OTP..." : "Send OTP"}
                            onPress={handleForgotPassword}
                            disabled={loading}
                            style={styles.submitButton}
                        />
                    </View>
                </AppCard>
            )}

            <AuthBackLink
                prefix="Remember your password? "
                text="Back to Login"
                showArrow={false}
                onPress={() => navigation.goBack()}
            />
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

    inputGroup: {
        marginBottom: 20,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.dark,
        marginBottom: 8,
    },

    input: {
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.dark,
    },

    inputError: {
        borderColor: COLORS.danger,
    },

    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 5,
    },

    submitButton: {
        marginTop: 10,
    },
});

ForgotPasswordScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
