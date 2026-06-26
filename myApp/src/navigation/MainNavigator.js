import React from "react";

import {
    Text,
} from "react-native";

import {
    createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import {
    createNativeStackNavigator,
} from "@react-navigation/native-stack";
import HealthRecordsScreen
    from "../screens/patient/HealthRecordsScreen";
import DashboardScreen from "../screens/patient/DashboardScreen";
import MyAppointmentsScreen from "../screens/patient/MyAppointmentsScreen";
import ProfileScreen from "../screens/patient/ProfileScreen";
import BookAppointmentScreen from "../screens/patient/BookAppointmentScreen";
import EditAppointmentScreen from "../screens/patient/EditAppointmentScreen";
import EditProfileScreen from "../screens/patient/EditProfileScreen";

import COLORS from "../utils/colors";
import PropTypes from "prop-types";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashboardTabIcon = () => <TabIcon icon="🏠" />;
const AppointmentTabIcon = () => <TabIcon icon="📅" />;
const ProfileTabIcon = () => <TabIcon icon="👤" />;

const TabIcon = ({ icon }) => {
    return (
        <Text style={{ fontSize: 21 }}>
            {icon}
        </Text>
    );
};

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.subtitle,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.border,
                    height: 64,
                    paddingBottom: 8,
                    paddingTop: 6,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "800",
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    title: "Home",
                    tabBarIcon: DashboardTabIcon,
                }}
            />

            <Tab.Screen
                name="MyAppointments"
                component={MyAppointmentsScreen}
                options={{
                    title: "Appointments",
                    tabBarIcon: AppointmentTabIcon,
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: "Profile",
                    tabBarIcon: ProfileTabIcon,
                }}
            />
        </Tab.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen
                name="MainTabs"
                component={MainTabs}
            />

            <Stack.Screen
                name="BookAppointment"
                component={BookAppointmentScreen}
            />

            <Stack.Screen
                name="EditAppointment"
                component={EditAppointmentScreen}
            />
            <Stack.Screen
                name="HealthRecords"
                component={HealthRecordsScreen}
            />

            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
            />
        </Stack.Navigator>
    );
}

TabIcon.propTypes = {
    icon: PropTypes.node.isRequired,
};