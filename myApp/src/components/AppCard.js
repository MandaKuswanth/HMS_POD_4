import React from "react";
import { View, StyleSheet } from "react-native";

export default function AppCard({ children, style }) {

    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 20,

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,

        elevation: 3
    }
});