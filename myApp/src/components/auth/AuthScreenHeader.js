import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function AuthScreenHeader({
    title,
    subtitle,
    children,
}) {
    return (
        <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: 30,
        marginTop: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: COLORS.dark,
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 14,
        color: COLORS.gray,
        lineHeight: 21,
    },
});

AuthScreenHeader.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    children: PropTypes.node,
};
