import React, { useState } from "react";

import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import ScreenHeader from "../../components/ScreenHeader";
import PatientContactForms from "../../components/forms/PatientContactForms";
import PatientPersonalForm from "../../components/forms/PatientPersonalForm";

import { useAuth } from "../../context/AuthContext";
import usePatientProfileForm, {
    getPatientFormInitialValues,
} from "../../hooks/usePatientProfileForm";

import {
    firstErrorMessage,
    validateEditProfileSubmit,
} from "../../utils/validators";

import PropTypes from "prop-types";

export default function EditProfileScreen({
    navigation,
}) {
    const { patient, updateProfile } = useAuth();
    const form = usePatientProfileForm({
        initialValues: getPatientFormInitialValues(patient),
    });
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        const submitErrors = validateEditProfileSubmit(
            form.getSubmitValues()
        );

        form.setErrors((prev) => ({
            ...prev,
            ...submitErrors,
        }));

        const message = firstErrorMessage(submitErrors);

        if (message) {
            Alert.alert(
                "Validation Error",
                message
            );
            return;
        }

        try {
            setLoading(true);

            await updateProfile(
                form.getPatientPayload({
                    optionalDob: true,
                })
            );

            Alert.alert(
                "Success",
                "Profile updated successfully"
            );

            navigation.goBack();
        } catch (err) {
            Alert.alert(
                "Error",
                err?.response?.data?.message ||
                err?.message ||
                "Update failed"
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
                contentContainerStyle={styles.scroll}
            >
                <ScreenHeader
                    title="Edit Profile"
                    subtitle="Update your personal information"
                    goBack={() => navigation.goBack()}
                />

                <AppCard style={styles.card}>
                    <PatientPersonalForm
                        name={form.name}
                        phone={form.phone}
                        gender={form.gender}
                        bloodGroup={form.bloodGroup}
                        dob={form.dob}
                        errors={form.errors}
                        onNameChange={form.handleNameChange}
                        onPhoneChange={form.handlePhoneChange}
                        onGenderChange={form.handleGenderChange}
                        onBloodGroupChange={form.setBloodGroup}
                        onDobChange={form.handleDobChange}
                    />
                </AppCard>

                <PatientContactForms
                    form={form}
                    cardStyle={styles.card}
                />

                <View style={styles.buttonContainer}>
                    <AppButton
                        title="Update Profile"
                        onPress={handleUpdate}
                        loading={loading}
                        disabled={loading}
                    />
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
    },

    card: {
        marginHorizontal: 20,
        marginBottom: 14,
    },

    buttonContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
});

EditProfileScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
