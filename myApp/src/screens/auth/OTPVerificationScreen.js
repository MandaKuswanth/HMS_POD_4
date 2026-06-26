import React, { useState, useEffect } from "react";

import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    TextInput
} from "react-native";

import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";
import AppButton from "../../components/AppButton";

import COLORS from "../../utils/colors";

import { isEmpty } from "../../utils/validators";

import { verifyOTPApi, resendOTPApi } from "../../api/authService";
import PropTypes from "prop-types";

export default function OTPVerificationScreen({ navigation, route }) {
    const { email } = route.params || {};

    const [otp, setOtp] = useState("");
    const [errors, setErrors] = useState({ otp: "" });
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const [resending, setResending] = useState(false);

    // Timer effect
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
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };

    const handleOTPChange = (value) => {
        // Only allow numbers and max 6 digits
        const numericValue = value.replaceAll(/\d/, "").slice(0, 6);
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
        // Validate OTP
        if (isEmpty(otp)) {
            updateError("otp", "OTP is required");
            Alert.alert("Validation Error", "Please enter the OTP");
            return;
        }

        if (otp.length !== 6) {
            updateError("otp", "OTP must be 6 digits");
            Alert.alert("Validation Error", "OTP must be 6 digits");
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
                Alert.alert("Success", "OTP verified successfully");
                
                // Navigate to reset password with token
                navigation.navigate("ResetPassword", {
                    email: email,
                    verificationToken: response.verificationToken
                });
            }

        } catch (error) {
            console.error("Verify OTP Error:", error);
            const errorMessage = error.response?.data?.message || error.message || "Failed to verify OTP";
            
            // Clear OTP field on wrong OTP
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

            // Reset timer
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
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Verify OTP</Text>
                        <Text style={styles.subtitle}>
                            We've sent a 6-digit OTP to {"\n"}
                            <Text style={styles.email}>{email}</Text>
                        </Text>
                    </View>

                    {/* OTP Input Card */}
                    <AppCard style={styles.otpCard}>
                        <View style={styles.otpContent}>
                            {/* OTP Input */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Enter OTP</Text>
                                <TextInput
                                    style={[
                                        styles.otpInput,
                                        errors.otp && styles.inputError,
                                        { letterSpacing: 10 }
                                    ]}
                                    placeholder="000000"
                                    placeholderTextColor={COLORS.lightGray}
                                    value={otp}
                                    onChangeText={handleOTPChange}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    editable={!loading && timeLeft > 0}
                                />
                                {errors.otp ? (
                                    <Text style={styles.errorText}>
                                        {errors.otp}
                                    </Text>
                                ) : null}
                            </View>

                            {/* Timer */}
                            <View style={[
                                styles.timerBox,
                                timeLeft <= 60 && styles.timerBoxExpiring
                            ]}>
                                <Text style={styles.timerIcon}>⏱</Text>
                                <View style={styles.timerContent}>
                                    <Text style={styles.timerLabel}>Time Remaining</Text>
                                    <Text style={[
                                        styles.timerValue,
                                        timeLeft <= 60 && styles.timerValueExpiring
                                    ]}>
                                        {formatTime(timeLeft)}
                                    </Text>
                                </View>
                            </View>

                            {/* Info Box */}
                            <View style={styles.infoBox}>
                                <Text style={styles.infoIcon}>ℹ</Text>
                                <Text style={styles.infoText}>
                                    OTP is valid for 10 minutes. If you don't receive it, check your spam folder.
                                </Text>
                            </View>

                            {/* Verify Button */}
                            <AppButton
                                title={loading ? "Verifying OTP..." : "Verify OTP"}
                                onPress={handleVerifyOTP}
                                disabled={loading || timeLeft === 0 || otp.length !== 6}
                                style={styles.verifyButton}
                            />

                            {/* Resend OTP */}
                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText}>Didn't receive OTP? </Text>
                                <TouchableOpacity
                                    onPress={handleResendOTP}
                                    disabled={!canResend || resending}
                                >
                                    <Text style={[
                                        styles.resendLink,
                                        (!canResend || resending) && styles.resendLinkDisabled
                                    ]}>
                                        {resending ? "Resending..." : "Resend"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </AppCard>

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
    email: {
        fontWeight: "600",
        color: COLORS.dark,
    },
    otpCard: {
        marginBottom: 20,
        paddingVertical: 25,
    },
    otpContent: {
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
    otpInput: {
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 15,
        fontSize: 24,
        fontWeight: "bold",
        color: COLORS.dark,
        textAlign: "center",
        backgroundColor: "#F9F9F9",
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 5,
    },
    timerBox: {
        flexDirection: "row",
        backgroundColor: "#E8F4F8",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
        alignItems: "center",
    },
    timerBoxExpiring: {
        backgroundColor: "#FFF0E8",
        borderLeftColor: COLORS.warning,
    },
    timerIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    timerContent: {
        flex: 1,
    },
    timerLabel: {
        fontSize: 12,
        color: COLORS.gray,
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
        backgroundColor: "#F0F8E8",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
    },
    infoIcon: {
        fontSize: 18,
        color: COLORS.success,
        marginRight: 10,
        fontWeight: "bold",
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.dark,
        lineHeight: 18,
    },
    verifyButton: {
        marginTop: 10,
        marginBottom: 15,
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    resendText: {
        fontSize: 13,
        color: COLORS.gray,
    },
    resendLink: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: "600",
    },
    resendLinkDisabled: {
        color: COLORS.lightGray,
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

OTPVerificationScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
};
