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

import COLORS from "../../utils/colors";
import AppCard from "../../components/AppCard";
import AppButton from "../../components/AppButton";
import AppContainer from "../../components/AppContainer";

export default function DashboardScreen({
    patient,
    logout,
    goToProfile,
    goToBookAppointment,
    goToMyAppointments
}) {

    return (

        <AppContainer>

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

                    <AppCard style={styles.actionCard}>
                        <TouchableOpacity
                            style={styles.actionContent}
                            onPress={goToProfile}
                        >
                            <Text style={styles.icon}>
                                👤
                            </Text>

                            <Text style={styles.actionText}>
                                My Profile
                            </Text>
                        </TouchableOpacity>
                    </AppCard>

                    <AppCard style={styles.actionCard}>
                        <TouchableOpacity
                            style={styles.actionContent}
                            onPress={goToBookAppointment}
                        >
                            <Text style={styles.icon}>
                                📅
                            </Text>

                            <Text style={styles.actionText}>
                                Book Appointment
                            </Text>
                        </TouchableOpacity>
                    </AppCard>

                    <AppCard style={styles.actionCard}>
                        <TouchableOpacity
                            style={styles.actionContent}
                            onPress={goToMyAppointments}
                        >
                            <Text style={styles.icon}>
                                📋
                            </Text>

                            <Text style={styles.actionText}>
                                My Appointments
                            </Text>
                        </TouchableOpacity>
                    </AppCard>

                </View>

                <View style={styles.logoutContainer}>
                    <AppButton
                        title="Logout"
                        onPress={logout}
                        color={COLORS.danger}
                    />
                </View>

            </ScrollView>

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    headerCard: {
        backgroundColor: COLORS.primary,
        margin: 20,
        padding: 24,
        borderRadius: 28
    },

    greeting: {
        color: COLORS.primaryLight,
        fontSize: 16
    },

    patientName: {
        color: COLORS.white,
        fontSize: 30,
        fontWeight: "700",
        marginTop: 6
    },

    uhidBadge: {
        alignSelf: "flex-start",
        marginTop: 15,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20
    },

    uhidText: {
        color: COLORS.primary,
        fontWeight: "700"
    },

    sectionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: COLORS.text,
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
        marginBottom: 15,
        borderRadius: 24
    },

    actionContent: {
        height: 120,
        justifyContent: "center",
        alignItems: "center"
    },

    icon: {
        fontSize: 34,
        marginBottom: 10
    },

    actionText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
        textAlign: "center"
    },

    logoutContainer: {
        margin: 20
    }
});