import React, { useContext } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { navigationRef } from "./navigationRef";
import { AuthContext } from "../context/AuthContext";

import SplashScreen from "../screens/SplashScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import PatientDashboardScreen from "../screens/PatientDashboardScreen";
import PatientProfileScreen from "../screens/PatientProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import BookAppointmentScreen from "../screens/BookAppointmentScreen";
import MyAppointmentsScreen from "../screens/MyAppointmentsScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { token, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {token ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="PatientDashboardScreen"
            component={PatientDashboardScreen}
          />
          <Stack.Screen
            name="PatientProfileScreen"
            component={PatientProfileScreen}
          />
          <Stack.Screen
            name="EditProfileScreen"
            component={EditProfileScreen}
          />
          <Stack.Screen
            name="BookAppointmentScreen"
            component={BookAppointmentScreen}
          />
          <Stack.Screen
            name="MyAppointmentsScreen"
            component={MyAppointmentsScreen}
          />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FBFF",
  },
});

export default AppNavigator;