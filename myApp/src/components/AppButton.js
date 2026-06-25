import React from "react";

import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

import COLORS from "../utils/colors";

export default function AppButton({
    title,
    onPress,
    disabled,
    loading,
    color = COLORS.primary,
    textColor = "#fff",
    style,
}) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor: color },
                (disabled || loading) && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.85}
        >
            {loading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        { color: textColor },
                    ]}
                >
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: 50,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },

    disabled: {
        opacity: 0.65,
    },

    text: {
        fontSize: 15,
        fontWeight: "900",
    },
});