import React, { useState } from "react";

import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";

import PatientContactForms from "../../components/forms/PatientContactForms";
import PatientPersonalForm from "../../components/forms/PatientPersonalForm";

import { useAuth } from "../../context/AuthContext";
import usePatientProfileForm from "../../hooks/usePatientProfileForm";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";
import {
    firstErrorMessage,
    validateRegisterSubmit,
} from "../../utils/validators";

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const form = usePatientProfileForm();
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const submitErrors = validateRegisterSubmit(
            form.getSubmitValues()
        );

        form.setErrors((prev) => ({
            ...prev,
            ...submitErrors,
        }));

        const message = firstErrorMessage(submitErrors);

        if (message) {
            Alert.alert("Validation Error", message);
            return;
        }

        try {
            setLoading(true);

            await register(
                form.getPatientPayload({
                    includeAuthFields: true,
                })
            );

            Alert.alert(
                "Success",
                "Account created successfully. Please login."
            );

            navigation.navigate("Login");
        } catch (err) {
            Alert.alert(
                "Registration Failed",
                err?.response?.data?.message ||
                err?.message ||
                "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.wrapper}>
                    <AppCard>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>🏥</Text>
                        </View>

                        <Text style={styles.title}>
                            Create Account
                        </Text>

                        <Text style={styles.subtitle}>
                            Register as a patient
                        </Text>

                        <PatientPersonalForm
                            name={form.name}
                            phone={form.phone}
                            email={form.email}
                            password={form.password}
                            gender={form.gender}
                            bloodGroup={form.bloodGroup}
                            dob={form.dob}
                            errors={form.errors}
                            onNameChange={form.handleNameChange}
                            onPhoneChange={form.handlePhoneChange}
                            onEmailChange={form.handleEmailChange}
                            onPasswordChange={form.handlePasswordChange}
                            onGenderChange={form.handleGenderChange}
                            onBloodGroupChange={form.setBloodGroup}
                            onDobChange={form.handleDobChange}
                            includeAuthFields
                            requiredDob
                            requiredPlaceholders
                        />

                        <PatientContactForms form={form} />

                        <AppButton
                            title="Create Account"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            style={styles.submitBtn}
                        />

                        <TouchableOpacity
                            onPress={() =>
                                navigation.navigate("Login")
                            }
                        >
                            <Text style={styles.switchText}>
                                Already have an account?{" "}
                                <Text style={styles.switchLink}>
                                    Login
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    </AppCard>
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        padding: 20,
    },

    logoContainer: {
        alignItems: "center",
        marginBottom: 15,
    },

    logo: {
        fontSize: 55,
    },

    title: {
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
        color: COLORS.text,
    },

    subtitle: {
        textAlign: "center",
        color: COLORS.subtitle,
        marginTop: 6,
        marginBottom: 24,
    },

    submitBtn: {
        marginTop: 8,
    },

    switchText: {
        marginTop: 18,
        textAlign: "center",
        color: COLORS.subtitle,
    },

    switchLink: {
        color: COLORS.primary,
        fontWeight: "900",
    },
});

RegisterScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
