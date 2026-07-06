import React from "react";

import {
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppContainer from "../AppContainer";
import PropTypes from "prop-types";

export default function AuthScreenLayout({ children }) {
    return (
        <AppContainer>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {children}
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
    },
});

AuthScreenLayout.propTypes = {
    children: PropTypes.node.isRequired,
};
