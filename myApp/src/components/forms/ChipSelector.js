import React from "react";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function ChipSelector({
    label,
    options,
    value,
    onChange,
    error,
    required = false,
    formatLabel,
}) {
    return (
        <>
            <Text style={styles.label}>
                {label}{required ? " *" : ""}
            </Text>

            <View style={styles.chipRow}>
                {options.map((option) => {
                    const displayText = formatLabel
                        ? formatLabel(option)
                        : option;

                    return (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.chip,
                                value === option &&
                                styles.chipActive,
                            ]}
                            onPress={() => onChange(option)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    value === option &&
                                    styles.chipTextActive,
                                ]}
                            >
                                {displayText}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {error ? (
                <Text style={styles.inlineError}>
                    {error}
                </Text>
            ) : null}
        </>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 10,
    },

    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },

    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },

    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },

    chipText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.text,
    },

    chipTextActive: {
        color: "#fff",
    },

    inlineError: {
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 10,
    },
});

ChipSelector.propTypes = {
    label: PropTypes.string,
    options: PropTypes.array,
    value: PropTypes.any,
    onChange: PropTypes.func,
    error: PropTypes.string,
    required: PropTypes.bool,
    formatLabel: PropTypes.func,
};
