import React, {
    useEffect,
    useState
} from "react";

import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert
} from "react-native";

import {
    getMyAppointments,
    cancelAppointment
} from "../../services/appointmentService";

import COLORS from "../../utils/colors";

import AppCard from "../../components/AppCard";
import AppButton from "../../components/AppButton";
import AppContainer from "../../components/AppContainer";
import AppHeader from "../../components/AppHeader";

export default function MyAppointmentsScreen({
    token,
    goBack,
    goToEditAppointment
}) {

    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {

        try {

            const response =
                await getMyAppointments(token);

            setAppointments(response.data);

        } catch (err) {

            console.log(err);

        } finally {

            setLoading(false);
        }
    };

    const handleCancel = async (appointmentId) => {

        Alert.alert(
            "Cancel Appointment",
            "Are you sure you want to cancel this appointment?",
            [
                {
                    text: "No"
                },
                {
                    text: "Yes",
                    onPress: async () => {

                        try {

                            await cancelAppointment(
                                appointmentId,
                                token
                            );

                            Alert.alert(
                                "Success",
                                "Appointment cancelled successfully"
                            );

                            loadAppointments();

                        } catch (err) {

                            Alert.alert(
                                "Error",
                                err?.response?.data?.message ||
                                "Unable to cancel appointment"
                            );
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status) => {

        switch (status) {

            case "PENDING":
                return "#F59E0B";

            case "BOOKED":
                return "#10B981";

            case "COMPLETED":
                return "#2563EB";

            case "CANCELLED":
                return "#DC2626";

            default:
                return "#64748B";
        }
    };

    if (loading) {

        return (

            <AppContainer>

                <View style={styles.loaderContainer}>

                    <ActivityIndicator
                        size="large"
                        color={COLORS.primary}
                    />

                </View>

            </AppContainer>
        );
    }

    return (

        <AppContainer>

            <AppHeader
                title="My Appointments"
                subtitle="View and manage your appointments"
                onBack={goBack}
            />

            <FlatList
                data={appointments}
                keyExtractor={(item) =>
                    item.appointmentId
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={

                    <Text style={styles.emptyText}>
                        No appointments found
                    </Text>
                }
                renderItem={({ item }) => (

                    <AppCard style={styles.card}>

                        <View style={styles.topRow}>

                            <View style={styles.avatar}>

                                <Text style={styles.avatarText}>
                                    {item.doctorName?.charAt(0)}
                                </Text>

                            </View>

                            <View style={{ flex: 1 }}>

                                <Text style={styles.doctor}>
                                    Dr. {item.doctorName}
                                </Text>

                                <Text style={styles.specialization}>
                                    {item.specialization}
                                </Text>

                            </View>

                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor:
                                            getStatusColor(
                                                item.status
                                            )
                                    }
                                ]}
                            >

                                <Text style={styles.statusText}>
                                    {item.status}
                                </Text>

                            </View>

                        </View>

                        <View style={styles.infoContainer}>

                            <Text style={styles.info}>
                                📅 {new Date(item.date).toDateString()}
                            </Text>

                            <Text style={styles.info}>
                                🕒 {item.timeSlot}
                            </Text>

                            <Text style={styles.info}>
                                🆔 {item.appointmentId}
                            </Text>

                        </View>

                        <View style={styles.buttonRow}>

                            {
                                item.status === "PENDING" && (

                                    <View style={{ flex: 1 }}>

                                        <AppButton
                                            title="Edit"
                                            onPress={() =>
                                                goToEditAppointment(item)
                                            }
                                        />

                                    </View>
                                )
                            }

                            {
                                item.status !== "CANCELLED" &&
                                item.status !== "COMPLETED" && (

                                    <View style={{ flex: 1 }}>

                                        <AppButton
                                            title="Cancel"
                                            color={COLORS.danger}
                                            onPress={() =>
                                                handleCancel(
                                                    item.appointmentId
                                                )
                                            }
                                        />

                                    </View>
                                )
                            }

                        </View>

                    </AppCard>
                )}
            />

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    card: {
        marginBottom: 15
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center"
    },

    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 14,

        shadowColor: COLORS.primary,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4
    },

    avatarText: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: "700"
    },

    doctor: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text
    },

    specialization: {
        color: COLORS.subtitle,
        marginTop: 2
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20
    },

    statusText: {
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "700"
    },

    infoContainer: {
        marginTop: 18,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: COLORS.border
    },

    info: {
        fontSize: 14,
        color: COLORS.text,
        marginBottom: 8
    },

    buttonRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 20
    },

    emptyText: {
        textAlign: "center",
        marginTop: 50,
        color: COLORS.subtitle
    }

});