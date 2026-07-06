import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

const REQUIREMENTS = [
    {
        label: "At least 8 characters",
        isMet: (password) => password.length >= 8,
    },
    {
        label: "At least one uppercase letter",
        isMet: (password) => /[A-Z]/.test(password),
    },
    {
        label: "At least one number",
        isMet: (password) => /\d/.test(password),
    },
];

export default function PasswordRequirements({ password }) {
    return (
        <View style={styles.requirementsBox}>
            <Text style={styles.requirementsTitle}>
                Password must contain:
            </Text>
            {REQUIREMENTS.map((requirement) => {
                const done = requirement.isMet(password);

                return (
                    <View
                        key={requirement.label}
                        style={styles.requirement}
                    >
                        <Text
                            style={[
                                styles.requirementIcon,
                                done && styles.requirementDone,
                            ]}
                        >
                            {done ? "OK" : "--"}
                        </Text>
                        <Text style={styles.requirementText}>
                            {requirement.label}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    requirementsBox: {
        backgroundColor: "#F0F8E8",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
    },

    requirementsTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.dark,
        marginBottom: 8,
    },

    requirement: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },

    requirementIcon: {
        fontSize: 12,
        color: COLORS.gray,
        marginRight: 10,
        fontWeight: "bold",
        minWidth: 22,
    },

    requirementDone: {
        color: COLORS.success,
    },

    requirementText: {
        fontSize: 13,
        color: COLORS.dark,
    },
});

PasswordRequirements.propTypes = {
    password: PropTypes.string.isRequired,
};
