import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from "react-native";

import { SafeAreaView }
    from "react-native-safe-area-context";

import { updatePatient }
    from "../../services/patientService";

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

        <SafeAreaView style={styles.container}>

            <ScrollView>

                <TouchableOpacity
                    onPress={goBack}
                >
                    <Text style={styles.back}>
                        ← Back
                    </Text>
                </TouchableOpacity>

                <Text style={styles.title}>
                    Edit Profile
                </Text>

                <View style={styles.card}>

                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Name"
                    />

                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Phone"
                        keyboardType="phone-pad"
                    />

                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Address"
                        multiline
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleUpdate}
                    >
                        <Text style={styles.buttonText}>
                            {
                                loading
                                    ? "Updating..."
                                    : "Update Profile"
                            }
                        </Text>
                    </TouchableOpacity>

                </View>

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#f3f4f6",
    },

    back: {
        margin: 20,
        color: "#2563eb",
        fontSize: 16,
        fontWeight: "600",
    },

    title: {
        fontSize: 26,
        fontWeight: "700",
        marginHorizontal: 20,
        marginBottom: 20,
    },

    card: {
        backgroundColor: "#fff",
        margin: 20,
        padding: 20,
        borderRadius: 16,
    },

    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        padding: 14,
        marginBottom: 15,
    },

    button: {
        backgroundColor: "#2563eb",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },

});