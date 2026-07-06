import React from "react";

import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function PasswordInputField({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    onToggleVisibility,
    error,
    editable,
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View
                style={[
                    styles.passwordInputWrapper,
                    error && styles.inputWrapperError,
                ]}
            >
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.subtitle}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    editable={editable}
                    style={styles.input}
                />
                <TouchableOpacity
                    onPress={onToggleVisibility}
                    style={styles.eyeIcon}
                >
                    <Text style={styles.eyeIconText}>
                        {secureTextEntry ? "Show" : "Hide"}
                    </Text>
                </TouchableOpacity>
            </View>
            {error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    inputGroup: {
        marginBottom: 20,
    },

    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.dark,
        marginBottom: 8,
    },

    passwordInputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: COLORS.lightGray,
        borderWidth: 1,
        borderRadius: 8,
        paddingRight: 10,
        backgroundColor: "#FAFAFA",
    },

    inputWrapperError: {
        borderColor: COLORS.danger,
    },

    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
        color: COLORS.dark,
        backgroundColor: "transparent",
    },

    eyeIcon: {
        padding: 8,
    },

    eyeIconText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: "600",
    },

    errorText: {
        color: COLORS.danger,
        fontSize: 12,
        marginTop: 5,
    },
});

PasswordInputField.propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChangeText: PropTypes.func.isRequired,
    secureTextEntry: PropTypes.bool.isRequired,
    onToggleVisibility: PropTypes.func.isRequired,
    error: PropTypes.string,
    editable: PropTypes.bool,
};
