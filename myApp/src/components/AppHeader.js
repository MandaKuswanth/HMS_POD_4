import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import COLORS from "../utils/colors";

export default function AppHeader({
    title,
    subtitle,
    onBack
}) {
    return (
        <View>

            <TouchableOpacity
                onPress={onBack}
            >
                <Text style={styles.back}>
                    ← Back
                </Text>
            </TouchableOpacity>

            <View style={styles.header}>
                <Text style={styles.title}>
                    {title}
                </Text>

                {
                    subtitle && (
                        <Text style={styles.subtitle}>
                            {subtitle}
                        </Text>
                    )
                }
            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    back: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: "600"
    },

    header: {
        marginVertical: 20
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.text
    },

    subtitle: {
        color: COLORS.subtitle,
        marginTop: 4
    }
});