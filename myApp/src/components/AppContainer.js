// src/components/AppContainer.js

import React from "react";

import {
    SafeAreaView
} from "react-native-safe-area-context";

import COLORS from "../utils/colors";

export default function AppContainer({
    children
}) {

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor:
                    COLORS.background
            }}
        >
            {children}
        </SafeAreaView>
    );
}