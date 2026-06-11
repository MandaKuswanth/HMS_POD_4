import React from "react";

import {
    View,
    Text,
    StyleSheet
} from "react-native";

import COLORS from "../utils/colors";

export default function AppAvatar({
    name,
    size = 60
}) {

    return (
        <View
            style={[
                styles.avatar,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2
                }
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        fontSize: size * 0.4
                    }
                ]}
            >
                {name?.charAt(0)?.toUpperCase()}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({

    avatar: {
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center"
    },

    text: {
        color: COLORS.white,
        fontWeight: "700"
    }
});