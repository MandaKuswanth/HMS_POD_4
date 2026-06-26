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
    isValidEmail,
} from "../../utils/validators";

import { forgotPasswordApi } from "../../api/authService";
import PropTypes from "prop-types";

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({ email: "" });
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

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

    const handleForgotPassword = async () => {
        // Validate email
        if (isEmpty(email)) {
            updateError("email", "Email is required");
            Alert.alert("Validation Error", "Email is required");
            return;
        }

        if (!isValidEmail(email)) {
            updateError("email", "Please enter a valid email address");
            Alert.alert("Validation Error", "Please enter a valid email address");
            return;
        }

        try {
            setLoading(true);

            await forgotPasswordApi({ email: email.trim().toLowerCase() });

            setEmailSent(true);
            
            // Auto navigate to OTP screen after 2 seconds
            setTimeout(() => {
                navigation.navigate("OTPVerification", { email: email.trim().toLowerCase() });
            }, 2000);

        } catch (error) {
            console.error("Forgot Password Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "An error occurred";
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
                        <Text style={styles.title}>Forgot Password?</Text>
                        <Text style={styles.subtitle}>
                            Enter your email address and we'll send you an OTP to reset your password.
                        </Text>
                    </View>

                    {/* Success Message */}
                    {emailSent && (
                        <AppCard style={styles.successCard}>
                            <View style={styles.successContent}>
                                <Text style={styles.successIcon}>✓</Text>
                                <Text style={styles.successText}>
                                    OTP sent successfully!
                                </Text>
                                <Text style={styles.successSubtext}>
                                    Check your email for the OTP
                                </Text>
                            </View>
                        </AppCard>
                    )}

                    {/* Email Input Form */}
                    {!emailSent && (
                        <AppCard style={styles.formCard}>
                            <View style={styles.formContent}>
                                {/* Email Field */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <AppInput
                                        placeholder="Enter your email"
                                        value={email}
                                        onChangeText={handleEmailChange}
                                        keyboardType="email-address"
                                        editable={!loading}
                                        style={[
                                            styles.input,
                                            errors.email && styles.inputError
                                        ]}
                                    />
                                    {errors.email ? (
                                        <Text style={styles.errorText}>
                                            {errors.email}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* Info Box */}
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoIcon}>ℹ</Text>
                                    <Text style={styles.infoText}>
                                        We'll send a 6-digit OTP to your email. The OTP will be valid for 10 minutes.
                                    </Text>
                                </View>

                                {/* Submit Button */}
                                <AppButton
                                    title={loading ? "Sending OTP..." : "Send OTP"}
                                    onPress={handleForgotPassword}
                                    disabled={loading}
                                    style={styles.submitButton}
                                />
                            </View>
                        </AppCard>
                    )}

                    {/* Back to Login Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Remember your password? </Text>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Text style={styles.footerLink}>Back to Login</Text>
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
    infoBox: {
        flexDirection: "row",
        backgroundColor: "#E8F4F8",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
    },
    infoIcon: {
        fontSize: 18,
        color: COLORS.primary,
        marginRight: 10,
        fontWeight: "bold",
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.dark,
        lineHeight: 18,
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
        paddingVertical: 20,
    },
    successIcon: {
        fontSize: 40,
        color: COLORS.success,
        marginBottom: 10,
    },
    successText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.success,
        marginBottom: 5,
    },
    successSubtext: {
        fontSize: 13,
        color: COLORS.gray,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
        color: COLORS.gray,
    },
    footerLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
    },
});

ForgotPasswordScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
