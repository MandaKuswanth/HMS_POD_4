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

import { SafeAreaView } from "react-native-safe-area-context";
import { registerPatient } from "../../services/authService";

export default function RegisterScreen({ goToLogin }) {

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("");
    const [dob, setDob] = useState("");
    const [address, setAddress] = useState("");

    const [loading, setLoading] = useState(false);

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

            const response =
                await registerPatient({
                    name,
                    phone,
                    email,
                    password,
                    gender,
                    dob,
                    address
                });

            console.log(
                "REGISTER RESPONSE:",
                response
            );

            Alert.alert(
                "Success",
                "Patient registered successfully"
            );

            if (goToLogin) {
                goToLogin();
            }

        } catch (err) {

            console.log(err);

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

        <SafeAreaView style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.card}>

                    <Text style={styles.title}>
                        HMS Patient Registration
                    </Text>

                    <TextInput
                        placeholder="Name"
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                    />

                    <TextInput
                        placeholder="Phone"
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />

                    <TextInput
                        placeholder="Email"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        placeholder="Password"
                        style={styles.input}
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

                    <TextInput
                        placeholder="DOB (YYYY-MM-DD)"
                        style={styles.input}
                        value={dob}
                        onChangeText={setDob}
                    />

                    <TextInput
                        placeholder="Address"
                        style={[
                            styles.input,
                            styles.addressInput
                        ]}
                        value={address}
                        onChangeText={setAddress}
                        multiline
                    />

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleRegister}
                        disabled={loading}
                    >

                        <Text style={styles.buttonText}>

                            {
                                loading
                                    ? "Registering..."
                                    : "Register"
                            }

                        </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={goToLogin}
                    >

                        <Text style={styles.switchText}>
                            Already have an account?
                            Login
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
        backgroundColor: "#F8FAFC",
    },

    card: {
        backgroundColor: "#FFFFFF",
        margin: 20,
        padding: 24,
        borderRadius: 20,
        elevation: 4,
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        textAlign: "center",
        color: "#0F172A",
        marginBottom: 20,
    },

    input: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 14,
        marginBottom: 15,
        backgroundColor: "#FFFFFF"
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 8,
    },

    genderContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 18,
    },

    genderButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 12,
        alignItems: "center",
    },

    selectedGender: {
        backgroundColor: "#0F766E",
        borderColor: "#0F766E",
    },

    genderText: {
        color: "#0F172A",
    },

    selectedGenderText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    addressInput: {
        height: 100,
        textAlignVertical: "top",
    },

    button: {
        backgroundColor: "#0F766E",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
    },

    buttonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },

    switchText: {
        marginTop: 20,
        textAlign: "center",
        color: "#0F766E",
        fontWeight: "600"
    },
});