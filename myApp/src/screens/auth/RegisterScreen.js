import React, { useState } from "react";

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView
} from "react-native";

import {
    registerPatient
} from "../../services/authService";

import AppContainer
    from "../../components/AppContainer";

import AppCard
    from "../../components/AppCard";

import AppInput
    from "../../components/AppInput";

import AppButton
    from "../../components/AppButton";

import COLORS
    from "../../utils/colors";

export default function RegisterScreen({
    goToLogin
}) {

    const [name, setName] =
        useState("");

    const [phone, setPhone] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [gender, setGender] =
        useState("");

    const [dob, setDob] =
        useState("");

    const [address, setAddress] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const handleRegister = async () => {

        if (
            !name ||
            !phone ||
            !email ||
            !password ||
            !gender ||
            !dob
        ) {

            Alert.alert(
                "Error",
                "Please fill all required fields"
            );

            return;
        }

        try {

            setLoading(true);

            await registerPatient({
                name,
                phone,
                email,
                password,
                gender,
                dob,
                address
            });

            Alert.alert(
                "Success",
                "Patient registered successfully"
            );

            goToLogin();

        } catch (err) {

            Alert.alert(
                "Registration Failed",
                err?.response?.data?.message ||
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
            >

                <View style={styles.wrapper}>

                    <AppCard>

                        <View style={styles.logoContainer}>
                            <Text style={styles.logo}>
                                🏥
                            </Text>
                        </View>

                        <Text style={styles.title}>
                            Create Account
                        </Text>

                        <Text style={styles.subtitle}>
                            Register as a patient
                        </Text>

                        <AppInput
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                        />

                        <AppInput
                            placeholder="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <AppInput
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <AppInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Text style={styles.label}>
                            Gender
                        </Text>

                        <View style={styles.genderContainer}>

                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    gender === "male" &&
                                    styles.selectedGender
                                ]}
                                onPress={() =>
                                    setGender("male")
                                }
                            >
                                <Text
                                    style={
                                        gender === "male"
                                            ? styles.selectedGenderText
                                            : styles.genderText
                                    }
                                >
                                    Male
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    gender === "female" &&
                                    styles.selectedGender
                                ]}
                                onPress={() =>
                                    setGender("female")
                                }
                            >
                                <Text
                                    style={
                                        gender === "female"
                                            ? styles.selectedGenderText
                                            : styles.genderText
                                    }
                                >
                                    Female
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.genderButton,
                                    gender === "others" &&
                                    styles.selectedGender
                                ]}
                                onPress={() =>
                                    setGender("others")
                                }
                            >
                                <Text
                                    style={
                                        gender === "others"
                                            ? styles.selectedGenderText
                                            : styles.genderText
                                    }
                                >
                                    Others
                                </Text>
                            </TouchableOpacity>

                        </View>

                        <AppInput
                            placeholder="DOB (YYYY-MM-DD)"
                            value={dob}
                            onChangeText={setDob}
                        />

                        <AppInput
                            placeholder="Address"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            style={styles.addressInput}
                        />

                        <AppButton
                            title={
                                loading
                                    ? "Registering..."
                                    : "Register"
                            }
                            onPress={handleRegister}
                        />

                        <TouchableOpacity
                            onPress={goToLogin}
                        >
                            <Text style={styles.switchText}>
                                Already have an account? Login
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
        padding: 20
    },

    logoContainer: {
        alignItems: "center",
        marginBottom: 15
    },

    logo: {
        fontSize: 55
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        textAlign: "center",
        color: COLORS.text,
        marginBottom: 8
    },

    subtitle: {
        textAlign: "center",
        color: COLORS.subtitle,
        marginBottom: 25,
        fontSize: 15
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 10
    },

    genderContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20
    },

    genderButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center"
    },

    selectedGender: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary
    },

    genderText: {
        color: COLORS.text
    },

    selectedGenderText: {
        color: COLORS.white,
        fontWeight: "700"
    },

    addressInput: {
        height: 100,
        textAlignVertical: "top"
    },

    switchText: {
        marginTop: 20,
        textAlign: "center",
        color: COLORS.primary,
        fontWeight: "600"
    }
});