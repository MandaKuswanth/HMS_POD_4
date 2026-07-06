import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import AppCard from "../AppCard";
import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function AuthStatusCard({
    title,
    subtitle,
    icon = "OK",
    style,
    contentStyle,
}) {
    return (
        <AppCard style={[styles.card, style]}>
            <View style={[styles.content, contentStyle]}>
                <Text style={styles.icon}>{icon}</Text>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 20,
        backgroundColor: "#E8F8F0",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.success,
    },

    content: {
        alignItems: "center",
        paddingVertical: 20,
    },

    icon: {
        fontSize: 40,
        color: COLORS.success,
        marginBottom: 10,
        fontWeight: "600",
    },

    title: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.success,
        marginBottom: 5,
        textAlign: "center",
    },

    subtitle: {
        fontSize: 13,
        color: COLORS.gray,
        textAlign: "center",
    },
});

AuthStatusCard.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string.isRequired,
    icon: PropTypes.string,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    contentStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
