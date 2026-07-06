import React from "react";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import COLORS from "../../utils/colors";
import PropTypes from "prop-types";

export default function AuthBackLink({
    text = "Back",
    prefix,
    showArrow = true,
    onPress,
}) {
    return (
        <View style={styles.footer}>
            {prefix ? (
                <Text style={styles.footerText}>{prefix}</Text>
            ) : null}
            <TouchableOpacity onPress={onPress}>
                <Text style={styles.footerLink}>
                    {showArrow ? "<- " : ""}
                    {text}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20,
    },

    footerText: {
        fontSize: 14,
        color: COLORS.gray,
    },

    footerLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
    },
});

AuthBackLink.propTypes = {
    text: PropTypes.string,
    prefix: PropTypes.string,
    showArrow: PropTypes.bool,
    onPress: PropTypes.func.isRequired,
};
