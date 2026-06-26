import React from "react";

import {
    Text,
    TouchableOpacity,
    View,
    StyleSheet,
} from "react-native";

import COLORS from "../utils/colors";
import PropTypes from "prop-types";

export default function ScreenHeader({
    title,
    subtitle,
    goBack,
    right,
}) {
    return (
        <View style={styles.header}>
            <View style={styles.row}>
                {goBack ? (
                    <TouchableOpacity
                        style={styles.back}
                        onPress={goBack}
                    >
                        <Text style={styles.backText}>
                            ‹
                        </Text>
                    </TouchableOpacity>
                ) : null}

                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>
                        {title}
                    </Text>

                    {subtitle ? (
                        <Text style={styles.subtitle}>
                            {subtitle}
                        </Text>
                    ) : null}
                </View>

                {right}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    back: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
    },

    backText: {
        fontSize: 34,
        color: COLORS.primary,
        marginTop: -3,
    },

    title: {
        fontSize: 26,
        fontWeight: "900",
        color: COLORS.text,
    },

    subtitle: {
        marginTop: 3,
        color: COLORS.subtitle,
        fontSize: 13,
    },
});

ScreenHeader.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    goBack: PropTypes.func,
    right: PropTypes.node,
};
