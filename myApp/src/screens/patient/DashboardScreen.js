import React from "react";

import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView
} from "react-native";

import { SafeAreaView }
    from "react-native-safe-area-context";

export default function DashboardScreen({
    patient,
    logout,
    goToProfile,
    goToBookAppointment,
    goToMyAppointments
}) {

    return (

        <SafeAreaView style={styles.container}>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.headerCard}>

                    <Text style={styles.greeting}>
                        Good Day 👋
                    </Text>

                    <Text style={styles.patientName}>
                        {patient?.name}
                    </Text>

                    <View style={styles.uhidBadge}>
                        <Text style={styles.uhidText}>
                            {patient?.UHID}
                        </Text>
                    </View>

                </View>

                <Text style={styles.sectionTitle}>
                    Quick Actions
                </Text>

                <View style={styles.grid}>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={goToProfile}
                    >
                        <Text style={styles.icon}>
                            👤
                        </Text>

                        <Text style={styles.actionText}>
                            My Profile
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={goToBookAppointment}
                    >
                        <Text style={styles.icon}>
                            📅
                        </Text>

                        <Text style={styles.actionText}>
                            Book Appointment
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={goToMyAppointments}
                    >
                        <Text style={styles.icon}>
                            📋
                        </Text>

                        <Text style={styles.actionText}>
                            My Appointments
                        </Text>
                    </TouchableOpacity>

                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={logout}
                >
                    <Text style={styles.logoutText}>
                        Logout
                    </Text>
                </TouchableOpacity>

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F8FAFC"
    },

    headerCard: {
        backgroundColor: "#0F766E",
        margin: 20,
        padding: 24,
        borderRadius: 24,

        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6
    },

    greeting: {
        color: "#CCFBF1",
        fontSize: 16
    },

    patientName: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "700",
        marginTop: 5
    },

    uhidBadge: {
        marginTop: 15,
        alignSelf: "flex-start",
        backgroundColor: "#14B8A6",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },

    uhidText: {
        color: "#fff",
        fontWeight: "600"
    },

    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#0F172A",
        marginHorizontal: 20,
        marginBottom: 15
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20
    },

    actionCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        paddingVertical: 30,
        borderRadius: 20,
        marginBottom: 15,
        alignItems: "center",

        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },

    icon: {
        fontSize: 34,
        marginBottom: 10
    },

    actionText: {
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
        color: "#0F172A"
    },

    logoutButton: {
        backgroundColor: "#DC2626",
        margin: 20,
        padding: 16,
        borderRadius: 16,
        alignItems: "center"
    },

    logoutText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16
    }
});