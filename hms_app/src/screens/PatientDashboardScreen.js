import React, { useContext, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { AppointmentContext } from "../context/AppointmentContext";
import { Ionicons } from "@expo/vector-icons";

const ActionCard = ({ title, icon, onPress, color }) => (
    <TouchableOpacity
        style={[styles.actionCard, { borderTopColor: color }]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
            <Ionicons name={icon} size={28} color={color} />
        </View>
        <Text style={styles.actionCardTitle}>{title}</Text>
    </TouchableOpacity>
);

const PatientDashboardScreen = ({ navigation }) => {
    const { user, patientData, logout } = useContext(AuthContext);
    const { appointments, getAppointments } = useContext(AppointmentContext);

    useEffect(() => {
        getAppointments();
    }, []);

    const bookedCount = appointments.filter(
        (a) => a.status === "BOOKED"
    ).length;

    const completedCount = appointments.filter(
        (a) => a.status === "COMPLETED"
    ).length;

    const handleLogout = async () => {
        await logout();
    };

    const handleProfileOpen = () => {
        console.log("Profile button clicked");
        navigation.navigate("PatientProfileScreen");
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome,</Text>
                    <Text style={styles.name}>
                        {patientData?.name || user?.name || "Patient"}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.uhidCard}>
                    <Text style={styles.uhidLabel}>UHID</Text>
                    <Text style={styles.uhidValue}>
                        {patientData?.UHID || patientData?.patientId || "Pending"}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Appointment Summary</Text>

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryNumber}>{appointments.length}</Text>
                        <Text style={styles.summaryLabel}>Total</Text>
                    </View>

                    <View style={styles.middleSummaryBox}>
                        <Text style={[styles.summaryNumber, { color: "#F9A825" }]}>
                            {bookedCount}
                        </Text>
                        <Text style={styles.summaryLabel}>Booked</Text>
                    </View>

                    <View style={styles.summaryBox}>
                        <Text style={[styles.summaryNumber, { color: "#2E7D32" }]}>
                            {completedCount}
                        </Text>
                        <Text style={styles.summaryLabel}>Completed</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.actionGrid}>
                    <ActionCard
                        title="Book Appointment"
                        icon="calendar"
                        color="#1976D2"
                        onPress={() => navigation.navigate("BookAppointmentScreen")}
                    />

                    <ActionCard
                        title="My Appointments"
                        icon="list"
                        color="#2E7D32"
                        onPress={() => navigation.navigate("MyAppointmentsScreen")}
                    />

                    <ActionCard
                        title="View Profile"
                        icon="person"
                        color="#F9A825"
                        onPress={handleProfileOpen}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FBFF",
    },

    header: {
        backgroundColor: "#1976D2",
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    greeting: {
        color: "#E3F2FD",
        fontSize: 16,
    },

    name: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 4,
    },

    logoutButton: {
        padding: 8,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 12,
    },

    scrollContent: {
        padding: 20,
    },

    uhidCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: "#1976D2",
    },

    uhidLabel: {
        fontSize: 16,
        color: "#6B7280",
        fontWeight: "bold",
    },

    uhidValue: {
        fontSize: 18,
        color: "#1F2937",
        fontWeight: "bold",
        letterSpacing: 1,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 12,
    },

    summaryContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    summaryBox: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
    },

    middleSummaryBox: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 8,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: "#E5E7EB",
    },

    summaryNumber: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1976D2",
        marginBottom: 4,
    },

    summaryLabel: {
        fontSize: 12,
        color: "#6B7280",
        fontWeight: "500",
    },

    actionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    actionCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderTopWidth: 4,
    },

    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },

    actionCardTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#1F2937",
        textAlign: "center",
    },
});

export default PatientDashboardScreen;