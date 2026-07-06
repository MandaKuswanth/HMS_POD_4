import React from "react";

import {
    StyleSheet,
    Text,
    View,
} from "react-native";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function AuthNoticeBox({
    children,
    icon = "i",
    style,
    iconStyle,
}) {
    return (
        <View style={[styles.box, style]}>
            <Text style={[styles.icon, iconStyle]}>{icon}</Text>
            <Text style={styles.text}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    box: {
        flexDirection: "row",
        backgroundColor: "#E8F4F8",
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        padding: 12,
        borderRadius: 4,
        marginBottom: 20,
    },

    icon: {
        fontSize: 18,
        color: COLORS.primary,
        marginRight: 10,
        fontWeight: "bold",
    },

    text: {
        flex: 1,
        fontSize: 13,
        color: COLORS.dark,
        lineHeight: 18,
    },
});

AuthNoticeBox.propTypes = {
    children: PropTypes.node.isRequired,
    icon: PropTypes.string,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    iconStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
