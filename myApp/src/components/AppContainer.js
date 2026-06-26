import React from "react";
import { View, StyleSheet } from "react-native";
import COLORS from "../utils/colors";
import PropTypes from "prop-types";

export default function AppContainer({ children, style }) {
    return (
        <View style={[styles.container, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
});

AppContainer.propTypes = {
    children: PropTypes.node,
    style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
