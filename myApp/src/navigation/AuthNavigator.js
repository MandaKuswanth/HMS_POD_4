import React from "react";

import {
    createNativeStackNavigator,
} from "@react-navigation/native-stack";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
// ✅ NEW: Import password reset screens
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import OTPVerificationScreen from "../screens/auth/OTPVerificationScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />

            <Stack.Screen
                name="Register"
                component={RegisterScreen}
            />

            {/* ✅ NEW: Password Reset Screens */}
            <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
            />

            <Stack.Screen
                name="OTPVerification"
                component={OTPVerificationScreen}
            />

            <Stack.Screen
                name="ResetPassword"
                component={ResetPasswordScreen}
            />
        </Stack.Navigator>
    );
}