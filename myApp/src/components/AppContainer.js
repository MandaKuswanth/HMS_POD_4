import React from "react";
import { View, StyleSheet } from "react-native";
import COLORS from "../utils/colors";

export default function AppContainer({ children, style }) {
    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});