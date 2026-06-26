import React from "react";

import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

import COLORS from "../utils/colors";
import PropTypes from "prop-types";

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

AppButton.propTypes = {
    title: PropTypes.string,
    onPress: PropTypes.func,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    color: PropTypes.string,
    textColor: PropTypes.string,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
