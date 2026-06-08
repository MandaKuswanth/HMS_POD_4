import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { loginPatient } from "../../services/authService";

export default function LoginScreen({
    goToRegister,
    goToHome
}) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    console.log("LOGIN DATA");
    console.log({
        email,
        password
    });

    const handleLogin = async () => {

        if (!email || !password) {

            Alert.alert(
                "Error",
                "Please enter email and password"
            );

            return;
        }

        try {

            setLoading(true);

            const response =
                await loginPatient({
                    email,
                    password
                });

            console.log(
                "LOGIN RESPONSE:",
                response
            );

            Alert.alert(
                "Success",
                "Login successful"
            );

            goToHome(response.data);

        } catch (err) {

            console.log("LOGIN ERROR");
            console.log(err.response?.status);
            console.log(err.response?.data);
            console.log(err.message);

            Alert.alert(
                "Login Failed",
                err?.response?.data?.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <SafeAreaView style={styles.container}>

            <View style={styles.card}>

                <Text style={styles.title}>
                    HMS Patient Login
                </Text>

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

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >

                    <Text style={styles.buttonText}>

                        {
                            loading
                                ? "Logging in..."
                                : "Login"
                        }

                    </Text>

                </TouchableOpacity>

                <TouchableOpacity
                    onPress={goToRegister}
                >

                    <Text style={styles.switchText}>
                        Don't have an account?
                        Register
                    </Text>

                </TouchableOpacity>

            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        padding: 20,
    },

    card: {
        backgroundColor: "#FFFFFF",
        padding: 25,
        borderRadius: 20,
        elevation: 4,
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        textAlign: "center",
        color: "#0F172A",
        marginBottom: 25,
    },

    input: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        padding: 14,
        marginBottom: 15,
        backgroundColor: "#FFFFFF"
    },

    button: {
        backgroundColor: "#0F766E",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 5
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