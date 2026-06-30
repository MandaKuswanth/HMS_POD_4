import React, { useState } from "react";
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

import { isEmpty, isValidEmail } from "../../utils/validators";
import { forgotPasswordApi } from "../../api/authService";

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
        updateError("email", isValidEmail(value) ? "" : "Please enter a valid email address");
    };

    const handleForgotPassword = async () => {
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
                            <Text style={styles.title}>Forgot Password?</Text>
                            <Text style={styles.subtitle}>
                                Enter your email address and we'll send you an OTP to reset your password.
                            </Text>
                        </View>

                        {emailSent ? (
                            <AppCard style={styles.successCard}>
                                <View style={styles.successContent}>
                                    <Text style={styles.successIcon}>✓</Text>
                                    <Text style={styles.successText}>OTP sent successfully!</Text>
                                    <Text style={styles.successSubtext}>Check your email for the OTP</Text>
                                </View>
                            </AppCard>
                        ) : (
                            <AppCard style={styles.formCard}>
                                <AppInput
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    editable={!loading}
                                    error={errors.email}
                                    returnKeyType="done"
                                    onSubmitEditing={handleForgotPassword}
                                />

                                <View style={styles.infoBox}>
                                    <Text style={styles.infoIcon}>ℹ</Text>
                                    <Text style={styles.infoText}>
                                        We'll send a 6-digit OTP to your email. The OTP will be valid for 10 minutes.
                                    </Text>
                                </View>

                                <AppButton
                                    title={loading ? "Sending..." : "Send OTP"}
                                    onPress={handleForgotPassword}
                                    loading={loading}
                                    style={styles.submitButton}
                                />
                            </AppCard>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Remember your password? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={styles.footerLink}>Back to Login</Text>
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
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.subtitle,
        textAlign: "center",
        lineHeight: 22,
    },
    formCard: {
        paddingVertical: 24,
        paddingHorizontal: 20,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoIcon: {
        fontSize: 20,
        color: COLORS.primary,
        marginRight: 12,
        fontWeight: "bold",
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    submitButton: {
        marginTop: 8,
    },
    successCard: {
        backgroundColor: COLORS.successLight,
        borderColor: COLORS.success,
        borderWidth: 1,
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
    },
    successSubtext: {
        fontSize: 15,
        color: COLORS.text,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 32,
    },
    footerText: {
        fontSize: 15,
        color: COLORS.subtitle,
    },
    footerLink: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: "bold",
    },
});
