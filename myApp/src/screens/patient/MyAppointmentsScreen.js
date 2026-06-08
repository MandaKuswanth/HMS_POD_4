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

import { SafeAreaView }
    from "react-native-safe-area-context";

import {
    getMyAppointments,
    cancelAppointment
} from "../../services/appointmentService";

export default function MyAppointmentsScreen({
    token,
    goBack,
    goToEditAppointment
}) {

    const [appointments,
        setAppointments] = useState([]);

    const [loading,
        setLoading] = useState(true);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments =
        async () => {

            try {

                const response =
                    await getMyAppointments(
                        token
                    );

                setAppointments(
                    response.data
                );

            } catch (err) {

                console.log(err);

            } finally {

                setLoading(false);

            }
        };

    const handleCancel =
        async (appointmentId) => {

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

    const getStatusColor =
        (status) => {

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

            <SafeAreaView
                style={styles.loaderContainer}
            >
                <ActivityIndicator
                    size="large"
                    color="#0F766E"
                />
            </SafeAreaView>
        );
    }

    return (

        <SafeAreaView
            style={styles.container}
        >

            <TouchableOpacity
                onPress={goBack}
            >
                <Text
                    style={styles.back}
                >
                    ← Back
                </Text>
            </TouchableOpacity>

            <Text
                style={styles.title}
            >
                My Appointments
            </Text>

            <FlatList
                data={appointments}
                keyExtractor={(item) =>
                    item.appointmentId
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text
                        style={styles.emptyText}
                    >
                        No appointments found
                    </Text>
                }
                renderItem={({ item }) => (

                    <View style={styles.card}>

                        <View
                            style={styles.doctorHeader}
                        >

                            <View
                                style={styles.doctorAvatar}
                            >
                                <Text
                                    style={styles.avatarText}
                                >
                                    {
                                        item.doctorName?.charAt(0)
                                    }
                                </Text>
                            </View>

                            <View>
                                <Text
                                    style={styles.doctor}
                                >
                                    Dr. {item.doctorName}
                                </Text>

                                <Text
                                    style={styles.specialization}
                                >
                                    {item.specialization}
                                </Text>
                            </View>

                        </View>

                        <View
                            style={styles.infoRow}
                        >
                            <Text
                                style={styles.info}
                            >
                                📅 {new Date(item.date).toDateString()}
                            </Text>
                        </View>

                        <View
                            style={styles.infoRow}
                        >
                            <Text
                                style={styles.info}
                            >
                                🕒 {item.timeSlot}
                            </Text>
                        </View>

                        <View
                            style={styles.infoRow}
                        >
                            <Text
                                style={styles.info}
                            >
                                🆔 {item.appointmentId}
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
                            <Text
                                style={styles.statusText}
                            >
                                {item.status}
                            </Text>
                        </View>

                        <View
                            style={styles.buttonRow}
                        >

                            {
                                item.status === "PENDING" && (

                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() =>
                                            goToEditAppointment(item)
                                        }
                                    >
                                        <Text
                                            style={styles.actionText}
                                        >
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                )
                            }

                            {
                                item.status !== "CANCELLED" &&
                                item.status !== "COMPLETED" && (

                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() =>
                                            handleCancel(
                                                item.appointmentId
                                            )
                                        }
                                    >
                                        <Text
                                            style={styles.actionText}
                                        >
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                )
                            }

                        </View>

                    </View>
                )}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 20
    },

    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    back: {
        color: "#0F766E",
        fontSize: 18,
        fontWeight: "600"
    },

    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#0F172A",
        marginVertical: 20
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3
    },

    doctorHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15
    },

    doctorAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#0F766E",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },

    avatarText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "700"
    },

    doctor: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A"
    },

    specialization: {
        color: "#64748B",
        marginTop: 2
    },

    infoRow: {
        marginTop: 8
    },

    info: {
        color: "#475569",
        fontSize: 14
    },

    statusBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 15
    },

    statusText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 12
    },

    buttonRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 15
    },

    editButton: {
        flex: 1,
        backgroundColor: "#0F766E",
        padding: 12,
        borderRadius: 12,
        alignItems: "center"
    },

    cancelButton: {
        flex: 1,
        backgroundColor: "#DC2626",
        padding: 12,
        borderRadius: 12,
        alignItems: "center"
    },

    actionText: {
        color: "#fff",
        fontWeight: "700"
    },

    emptyText: {
        textAlign: "center",
        marginTop: 50,
        color: "#64748B"
    }
});