import React from "react";

import {
    Text,
    TextInput,
    View,
    StyleSheet,
} from "react-native";

import COLORS from "../utils/colors";
import PropTypes from "prop-types";

export default function AppInput({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    multiline,
    numberOfLines,
    style,
    error,
}) {
    return (
        <View style={styles.wrapper}>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                multiline={multiline}
                numberOfLines={numberOfLines}
                placeholderTextColor={COLORS.subtitle}
                style={[
                    styles.input,
                    multiline && styles.multiline,
                    error && styles.inputError,
                    style,
                ]}
            />

            {error ? (
                <Text style={styles.errorText}>
                    {error}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 12,
    },

    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: COLORS.text,
    },

    multiline: {
        minHeight: 100,
        textAlignVertical: "top",
    },

    inputError: {
        borderColor: COLORS.danger,
    },

    errorText: {
        marginTop: 5,
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: "700",
    },
});

AppInput.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChangeText: PropTypes.func,
    placeholder: PropTypes.string,
    secureTextEntry: PropTypes.bool,
    keyboardType: PropTypes.string,
    autoCapitalize: PropTypes.string,
    multiline: PropTypes.bool,
    numberOfLines: PropTypes.number,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    error: PropTypes.string,
};
