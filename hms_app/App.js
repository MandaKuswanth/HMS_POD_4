import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppointmentProvider } from './src/context/AppointmentContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppointmentProvider>
          <StatusBar style="light" backgroundColor="#1976D2" />
          <AppNavigator />
        </AppointmentProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
