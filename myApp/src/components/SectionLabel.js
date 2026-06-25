import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import COLORS from "../utils/colors";

export default function SectionLabel({ text }) {
    return (
        <View style={styles.row}>
            <Text style={styles.text}>
                {text}
            </Text>

            <View style={styles.line} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 14,
        gap: 10,
    },

    text: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.subtitle,
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: COLORS.border,
    },
});