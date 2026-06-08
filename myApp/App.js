import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";

import DashboardScreen from "./src/screens/patient/DashboardScreen";
import ProfileScreen from "./src/screens/patient/ProfileScreen";
import EditProfileScreen from "./src/screens/patient/EditProfileScreen";
import BookAppointmentScreen from "./src/screens/patient/BookAppointmentScreen";
import MyAppointmentsScreen from "./src/screens/patient/MyAppointmentsScreen";
import EditAppointmentScreen from "./src/screens/patient/EditAppointmentScreen";

export default function App() {

  const [screen, setScreen] = useState("login");

  const [patient, setPatient] = useState(null);

  const [token, setToken] = useState(null);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const goToHome = (loginData) => {

    setPatient(loginData.patient);

    setToken(loginData.token);

    setScreen("home");
  };

  const logout = () => {

    setPatient(null);

    setToken(null);

    setScreen("login");
  };

  const goToProfile = () => {

    setScreen("profile");
  };

  const goToEditProfile = () => {

    setScreen("editProfile");
  };

  const handlePatientUpdate = (
    updatedPatient
  ) => {

    setPatient(updatedPatient);
  };

  const goToBookAppointment = () => {
    setScreen("bookAppointment");
  };

  const goToMyAppointments = () => {
    setScreen("myAppointments");
  };

  const goToEditAppointment = (appointment) => {

    setSelectedAppointment(
      appointment
    );

    setScreen(
      "editAppointment"
    );
  };

  return (
    <SafeAreaProvider>

      {
        screen === "login" && (
          <LoginScreen
            goToRegister={() =>
              setScreen("register")
            }
            goToHome={goToHome}
          />
        )
      }

      {
        screen === "register" && (
          <RegisterScreen
            goToLogin={() =>
              setScreen("login")
            }
          />
        )
      }

      {
        screen === "home" && (
          <DashboardScreen
            patient={patient}
            logout={logout}
            goToProfile={goToProfile}
            goToBookAppointment={goToBookAppointment}
            goToMyAppointments={goToMyAppointments}
          />
        )
      }

      {
        screen === "profile" && (
          <ProfileScreen
            patient={patient}
            goBack={() =>
              setScreen("home")
            }
            goToEditProfile={
              goToEditProfile
            }
          />
        )
      }

      {
        screen === "editProfile" && (
          <EditProfileScreen
            patient={patient}
            token={token}
            goBack={() =>
              setScreen("profile")
            }
            onUpdate={
              handlePatientUpdate
            }
          />
        )
      }
      {
        screen === "bookAppointment" && (
          <BookAppointmentScreen
            token={token}
            goBack={() =>
              setScreen("home")
            }
          />
        )
      }

      {
        screen === "myAppointments" && (
          <MyAppointmentsScreen
            token={token}
            goBack={() =>
              setScreen("home")
            }
            goToEditAppointment={
              goToEditAppointment
            }
          />
        )
      }
      {
        screen === "editAppointment" && (

          <EditAppointmentScreen
            appointment={
              selectedAppointment
            }
            token={token}
            goBack={() =>
              setScreen(
                "myAppointments"
              )
            }
          />

        )
      }

    </SafeAreaProvider>
  );
}