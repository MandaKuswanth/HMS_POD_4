import React, { useState, useEffect } from "react";
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
    Keyboard,
    TextInput
} from "react-native";

import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";
import AppButton from "../../components/AppButton";

import COLORS from "../../utils/colors";
import { isEmpty } from "../../utils/validators";
import { verifyOTPApi, resendOTPApi } from "../../api/authService";

export default function OTPVerificationScreen({ navigation, route }) {
    const { email } = route.params || {};

    const [otp, setOtp] = useState("");
    const [errors, setErrors] = useState({ otp: "" });
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
    const [canResend, setCanResend] = useState(false);
    const [resending, setResending] = useState(false);

    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const updateError = (field, message) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
    };

    const handleOTPChange = (value) => {
        const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
        setOtp(numericValue);

        if (isEmpty(numericValue)) {
            updateError("otp", "");
            return;
        }

        if (numericValue.length < 6) {
            updateError("otp", "OTP must be 6 digits");
            return;
        }

        updateError("otp", "");
    };

    const handleVerifyOTP = async () => {
        if (isEmpty(otp)) {
            updateError("otp", "OTP is required");
            return;
        }

        if (otp.length !== 6) {
            updateError("otp", "OTP must be 6 digits");
            return;
        }

        if (!email) {
            Alert.alert("Error", "Email is missing. Please go back and try again.");
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);
            const response = await verifyOTPApi({
                email: email.toLowerCase(),
                otp: otp.trim()
            });

            if (response.verificationToken) {
                navigation.navigate("ResetPassword", {
                    email: email,
                    verificationToken: response.verificationToken
                });
            }
        } catch (error) {
            console.error("Verify OTP Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to verify OTP";
            if (errorMessage.includes("Invalid")) {
                setOtp("");
            }
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) {
            Alert.alert("Please Wait", `You can resend OTP in ${formatTime(timeLeft)}`);
            return;
        }
        if (!email) {
            Alert.alert("Error", "Email is missing. Please go back and try again.");
            navigation.goBack();
            return;
        }

        try {
            setResending(true);
            await resendOTPApi({ email: email.toLowerCase() });
            
            setTimeLeft(600);
            setCanResend(false);
            setOtp("");
            Alert.alert("Success", "OTP sent again to your email");
        } catch (error) {
            console.error("Resend OTP Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to resend OTP";
            Alert.alert("Error", errorMessage);
        } finally {
            setResending(false);
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
                            <Text style={styles.title}>Verify OTP</Text>
                            <Text style={styles.subtitle}>
                                We've sent a 6-digit OTP to{"\n"}
                                <Text style={styles.email}>{email}</Text>
                            </Text>
                        </View>

                        <AppCard style={styles.card}>
                            <View style={styles.inputGroup}>
                                <TextInput
                                    style={[
                                        styles.otpInput,
                                        errors.otp ? styles.inputError : null,
                                        { letterSpacing: otp.length > 0 ? 12 : 2 }
                                    ]}
                                    placeholder="Enter OTP"
                                    placeholderTextColor={COLORS.subtitle}
                                    value={otp}
                                    onChangeText={handleOTPChange}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading && timeLeft > 0}
                                    returnKeyType="done"
                                    onSubmitEditing={handleVerifyOTP}
                                />
                                {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
                            </View>

                            <View style={[styles.timerBox, timeLeft <= 60 && styles.timerBoxExpiring]}>
                                <Text style={styles.timerIcon}>⏱</Text>
                                <View style={styles.timerContent}>
                                    <Text style={styles.timerLabel}>Time Remaining</Text>
                                    <Text style={[styles.timerValue, timeLeft <= 60 && styles.timerValueExpiring]}>
                                        {formatTime(timeLeft)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoBox}>
                                <Text style={styles.infoIcon}>ℹ</Text>
                                <Text style={styles.infoText}>
                                    OTP is valid for 10 minutes. Check your spam folder if not received.
                                </Text>
                            </View>

                            <AppButton
                                title={loading ? "Verifying..." : "Verify OTP"}
                                onPress={handleVerifyOTP}
                                loading={loading}
                                disabled={loading || timeLeft === 0 || otp.length !== 6}
                                style={styles.verifyButton}
                            />

                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText}>Didn't receive OTP? </Text>
                                <TouchableOpacity onPress={handleResendOTP} disabled={!canResend || resending}>
                                    <Text style={[styles.resendLink, (!canResend || resending) && styles.resendLinkDisabled]}>
                                        {resending ? "Resending..." : "Resend"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </AppCard>

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
        marginBottom: 12,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.subtitle,
        textAlign: "center",
        lineHeight: 22,
    },
    email: {
        fontWeight: "bold",
        color: COLORS.primary,
    },
    card: {
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    otpInput: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingVertical: 18,
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.text,
        textAlign: "center",
    },
    inputError: {
        borderColor: COLORS.danger,
        backgroundColor: COLORS.dangerLight,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: "600",
        marginTop: 6,
        textAlign: "center",
    },
    timerBox: {
        flexDirection: "row",
        backgroundColor: COLORS.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        alignItems: "center",
    },
    timerBoxExpiring: {
        backgroundColor: COLORS.warningLight,
    },
    timerIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    timerContent: {
        flex: 1,
    },
    timerLabel: {
        fontSize: 13,
        color: COLORS.subtitle,
        marginBottom: 4,
    },
    timerValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.primary,
    },
    timerValueExpiring: {
        color: COLORS.warning,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.successLight,
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoIcon: {
        fontSize: 20,
        color: COLORS.success,
        marginRight: 12,
        fontWeight: "bold",
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    verifyButton: {
        marginBottom: 24,
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    resendText: {
        fontSize: 15,
        color: COLORS.subtitle,
    },
    resendLink: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: "bold",
    },
    resendLinkDisabled: {
        color: COLORS.disabledText,
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
        fontWeight: "bold",
    },
});
