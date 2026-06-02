import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";


const Header = ({ title, showBack = true }) => {
    const navigation = useNavigation();

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate("PatientDashboardScreen"); // change Home to your main screen name
        }
    };

    return (
        <View style={styles.container}>
            {showBack ? (
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            ) : (
                <View style={styles.placeholder} />
            )}

            <Text style={styles.title}>{title}</Text>

            <View style={styles.placeholder} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 60,
        backgroundColor: "#1976D2",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
    },

    backButton: {
        padding: 8,
        width: 40,
        alignItems: "center",
    },

    title: {
        flex: 1,
        textAlign: "center",
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
    },

    placeholder: {
        width: 40,
    },
});

export default Header;