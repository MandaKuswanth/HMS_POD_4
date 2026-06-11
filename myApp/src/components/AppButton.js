import React from "react";

import {
    TouchableOpacity,
    Text,
    StyleSheet
} from "react-native";

export default function AppButton({
    title,
    onPress,
    color = "#2563EB"
}) {

    return (

        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: color }
            ]}
            onPress={onPress}
        >

            <Text style={styles.text}>
                {title}
            </Text>

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({

    button: {
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: "center"
    },

    text: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16
    }
});