import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "./src/context/AuthContext";
import { AppointmentProvider } from "./src/context/AppointmentContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppointmentProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AppointmentProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}