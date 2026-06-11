// src/components/AppInput.js

import React from "react";

import {
    TextInput,
    StyleSheet
} from "react-native";

import COLORS from "../utils/colors";

export default function AppInput(props) {

    return (
        <TextInput
            {...props}
            style={[
                styles.input,
                props.style
            ]}
        />
    );
}

const styles = StyleSheet.create({

    input: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 15
    }
});