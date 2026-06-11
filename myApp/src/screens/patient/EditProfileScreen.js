import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    ScrollView,
    TouchableOpacity
} from "react-native";

import AppContainer
    from "../../components/AppContainer";

import AppCard
    from "../../components/AppCard";

import AppButton
    from "../../components/AppButton";

import COLORS
    from "../../utils/colors";

import {
    updatePatient
} from "../../services/patientService";

export default function EditProfileScreen({
    patient,
    token,
    goBack,
    onUpdate
}) {

    const [name, setName] =
        useState(patient?.name || "");

    const [phone, setPhone] =
        useState(patient?.phone || "");

    const [address, setAddress] =
        useState(patient?.address || "");

    const [loading, setLoading] =
        useState(false);

    const handleUpdate = async () => {

        try {

            setLoading(true);

            const response =
                await updatePatient(
                    patient.UHID,
                    {
                        name,
                        phone,
                        address
                    },
                    token
                );

            Alert.alert(
                "Success",
                "Profile updated successfully"
            );

            onUpdate(
                response.data
            );

            goBack();

        } catch (err) {

            console.log(err);

            Alert.alert(
                "Error",
                err?.response?.data?.message ||
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
            >

                <TouchableOpacity
                    onPress={goBack}
                >
                    <Text style={styles.back}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                <View style={styles.header}>

                    <Text style={styles.title}>
                        Edit Profile
                    </Text>

                    <Text style={styles.subtitle}>
                        Update your personal information
                    </Text>

                </View>

                <AppCard style={styles.card}>

                    <Text style={styles.label}>
                        Full Name
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter name"
                        placeholderTextColor={
                            COLORS.subtitle
                        }
                    />

                    <Text style={styles.label}>
                        Phone Number
                    </Text>

                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter phone"
                        keyboardType="phone-pad"
                        placeholderTextColor={
                            COLORS.subtitle
                        }
                    />

                    <Text style={styles.label}>
                        Address
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            styles.addressInput
                        ]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Enter address"
                        multiline
                        placeholderTextColor={
                            COLORS.subtitle
                        }
                    />

                </AppCard>

                <View style={styles.buttonContainer}>
                    <AppButton
                        title={
                            loading
                                ? "Updating..."
                                : "Update Profile"
                        }
                        onPress={handleUpdate}
                    />
                </View>

            </ScrollView>

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    back: {
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 10,
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: "600"
    },

    header: {
        paddingHorizontal: 20,
        marginBottom: 20
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.text
    },

    subtitle: {
        color: COLORS.subtitle,
        marginTop: 4,
        fontSize: 14
    },

    card: {
        marginHorizontal: 20
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 10
    },

    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: COLORS.text,
        backgroundColor: COLORS.white,
        marginBottom: 10
    },

    addressInput: {
        height: 100,
        textAlignVertical: "top"
    },

    buttonContainer: {
        margin: 20
    }

});