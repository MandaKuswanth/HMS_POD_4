import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";

import COLORS from "../utils/colors";

export default function ScreenHeader({
    title,
    goBack
}) {

    return (
        <View style={styles.container}>

            <TouchableOpacity
                onPress={goBack}
            >
                <Text style={styles.back}>
                    ← Back
                </Text>
            </TouchableOpacity>

            <Text style={styles.title}>
                {title}
            </Text>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        marginBottom: 20
    },

    back: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: "600"
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: COLORS.text,
        marginTop: 15
    }
});