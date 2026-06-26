import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from "react-native";
import AppContainer from "../../components/AppContainer";
import AppCard from "../../components/AppCard";
import COLORS from "../../utils/colors";
import { resetTemporaryPasswordApi } from "../../api/authService";
import PropTypes from "prop-types";

export default function ForceResetPasswordScreen({ navigation, route }) {
    const { email } = route.params;
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordRequirements, setPasswordRequirements] = useState({
        minLength: false,
        hasUppercase: false,
        hasNumber: false,
        passwordsMatch: false,
    });

    // Check password requirements in real-time
    useEffect(() => {
        setPasswordRequirements({
            minLength: newPassword.length >= 8,
            hasUppercase: /[A-Z]/.test(newPassword),
            hasNumber: /\d/.test(newPassword),
            passwordsMatch:
                newPassword &&
                confirmPassword &&
                newPassword === confirmPassword,
        });
    }, [newPassword, confirmPassword]);

    const isPasswordValid =
        passwordRequirements.minLength &&
        passwordRequirements.hasUppercase &&
        passwordRequirements.hasNumber &&
        passwordRequirements.passwordsMatch;

    const handleResetPassword = async () => {
        if (!isPasswordValid) {
            Alert.alert("Validation Error", "Please fill all requirements");
            return;
        }

        setLoading(true);
        try {
            const response = await resetTemporaryPasswordApi({
                email: email.trim().toLowerCase(),
                newPassword,
                confirmPassword,
            });

            console.log("Reset Password Response:", response);

            // Show success alert and navigate after user dismisses it
            Alert.alert(
                "Success",
                "Password reset successfully! Please login with your new password.",
                [
                    {
                        text: "OK",
                        onPress: () => {
                            console.log("Navigating to Login...");
                            // Use a timeout to ensure navigation happens after alert is fully dismissed
                            setTimeout(() => {
                                navigation.replace("Login");
                            }, 100);
                        },
                    },
                ],
                { cancelable: false }
            );
        } catch (error) {
            console.error("Reset Password Error:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to reset password. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Reset Your Password</Text>
                    <Text style={styles.subtitle}>
                        You are using a temporary password. Please set a new password to continue.
                    </Text>
                </View>

                {/* Card Container */}
                <AppCard>
                    {/* Info Message */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={styles.infoText}>
                            For security, you must change your temporary password on first login.
                        </Text>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.passwordInputWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Enter new password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <Text style={styles.eyeIcon}>
                                    {showNewPassword ? "👁️" : "👁️‍🗨️"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Password Requirements */}
                        <View style={styles.requirementsContainer}>
                            <RequirementItem
                                met={passwordRequirements.minLength}
                                text="At least 8 characters"
                            />
                            <RequirementItem
                                met={passwordRequirements.hasUppercase}
                                text="Contains uppercase letter (A-Z)"
                            />
                            <RequirementItem
                                met={passwordRequirements.hasNumber}
                                text="Contains number (0-9)"
                            />
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.passwordInputWrapper}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Confirm new password"
                                placeholderTextColor="#999"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!loading}
                            />
                            <TouchableOpacity
                                onPress={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                <Text style={styles.eyeIcon}>
                                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Match Status */}
                        {confirmPassword && (
                            <View
                                style={[
                                    styles.requirementItem,
                                    {
                                        backgroundColor: passwordRequirements.passwordsMatch
                                            ? "#E8F5E9"
                                            : "#FFEBEE",
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        marginRight: 8,
                                        color: passwordRequirements.passwordsMatch
                                            ? "#4CAF50"
                                            : "#F44336",
                                    }}
                                >
                                    {passwordRequirements.passwordsMatch ? "✓" : "✕"}
                                </Text>
                                <Text
                                    style={[
                                        styles.requirementText,
                                        {
                                            color: passwordRequirements.passwordsMatch
                                                ? "#4CAF50"
                                                : "#F44336",
                                        },
                                    ]}
                                >
                                    {passwordRequirements.passwordsMatch
                                        ? "Passwords match"
                                        : "Passwords do not match"}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            { opacity: isPasswordValid && !loading ? 1 : 0.6 },
                        ]}
                        onPress={handleResetPassword}
                        disabled={!isPasswordValid || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>
                                Reset Password
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Security Note */}
                    <View style={styles.securityNote}>
                        <Text style={styles.securityIcon}>🔒</Text>
                        <Text style={styles.securityText}>
                            Your password is securely encrypted. After reset, you'll be
                            redirected to login.
                        </Text>
                    </View>
                </AppCard>
            </ScrollView>
        </AppContainer>
    );
}

// Requirement Item Component
const RequirementItem = ({ met, text }) => (
    <View style={styles.requirementItem}>
        <Text
            style={{
                fontSize: 16,
                marginRight: 8,
                color: met ? "#4CAF50" : "#999",
            }}
        >
            {met ? "✓" : "○"}
        </Text>
        <Text
            style={[
                styles.requirementText,
                { color: met ? "#4CAF50" : "#999" },
            ]}
        >
            {text}
        </Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        marginBottom: 20,
        marginTop: 10,
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
        lineHeight: 20,
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
    passwordInput: {
        flex: 1,
        height: 45,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    eyeIcon: {
        fontSize: 18,
        padding: 8,
    },
    requirementsContainer: {
        marginTop: 12,
        marginBottom: 8,
    },
    requirementItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginVertical: 4,
        borderRadius: 6,
        backgroundColor: "#F5F5F5",
    },
    requirementText: {
        fontSize: 13,
        color: "#666",
    },
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 20,
        marginBottom: 15,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#E3F2FD",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 20,
    },
    infoIcon: {
        fontSize: 18,
        marginRight: 10,
        marginTop: 2,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#1976D2",
        lineHeight: 18,
    },
    securityNote: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 15,
    },
    securityIcon: {
        fontSize: 16,
        marginRight: 10,
        marginTop: 2,
    },
    securityText: {
        flex: 1,
        fontSize: 12,
        color: "#666",
        lineHeight: 16,
    },
});

ForceResetPasswordScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
    route: PropTypes.object.isRequired,
};

RequirementItem.propTypes = {
    met: PropTypes.bool.isRequired,
    text: PropTypes.string.isRequired,
};