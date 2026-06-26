import React from "react";

import {
    View,
    StyleSheet,
} from "react-native";

import COLORS from "../utils/colors";
import PropTypes from "prop-types";

export default function AppCard({
    children,
    style,
}) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 22,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
});

AppCard.propTypes = {
    children: PropTypes.node,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
