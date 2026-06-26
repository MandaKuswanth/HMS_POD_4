import React, { useCallback } from "react";

import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import ScreenHeader from "../../components/ScreenHeader";

import { useAppointments } from "../../context/AppointmentContext";

import COLORS from "../../utils/colors";
import { formatDateDisplay } from "../../utils/dateUtils";
import PropTypes from "prop-types";

const canEdit = (status) => {
    return status === "PENDING";
};

const canCancel = (status) => {
    return status !== "COMPLETED" && status !== "CANCELLED";
};

export default function MyAppointmentsScreen({
    navigation,
}) {
    const {
        appointments,
        appointmentsLoading,
        appointmentsLoadingMore,
        appointmentsHasMore,
        appointmentTotalCount,
        loadAppointments,
        loadMoreAppointments,
        cancelAppointment,
    } = useAppointments();

    useFocusEffect(
        useCallback(() => {
            loadAppointments({
                page: 1,
            });
        }, [loadAppointments])
    );

    const handleCancel = (appointmentId) => {
        Alert.alert(
            "Cancel Appointment",
            "Are you sure you want to cancel this appointment?",
            [
                {
                    text: "No",
                    style: "cancel",
                },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: () => {
                        void (async () => {
                            try {
                                await cancelAppointment(appointmentId);

                                Alert.alert(
                                    "Success",
                                    "Appointment cancelled"
                                );
                            } catch (err) {
                                Alert.alert(
                                    "Error",
                                    err?.response?.data?.message ??
                                    "Unable to cancel appointment"
                                );
                            }
                        })();
                    },
                },
            ]
        );
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="Appointments"
                subtitle="Book and view your hospital appointments"
            />

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() =>
                        navigation.navigate("BookAppointment")
                    }
                >
                    <Text style={styles.tabText}>
                        Book Appointment
                    </Text>
                </TouchableOpacity>

                <View style={[styles.tab, styles.tabActive]}>
                    <Text
                        style={[
                            styles.tabText,
                            styles.tabTextActive,
                        ]}
                    >
                        My Appointments
                    </Text>
                </View>
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>
                    My Appointments
                </Text>

                <Text style={styles.listCount}>
                    {appointmentTotalCount || appointments.length} total
                </Text>
            </View>

            {appointmentsLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.primary}
                    />
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item, index) =>
                        item.appointmentId?.toString() ||
                        item._id?.toString() ||
                        String(index)
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            No appointments found
                        </Text>
                    }
                    ListFooterComponent={
                        appointmentsLoadingMore ? (
                            <View style={styles.footerLoader}>
                                <ActivityIndicator
                                    size="small"
                                    color={COLORS.primary}
                                />
                            </View>
                        ) : null
                    }
                    onEndReached={() => {
                        if (appointmentsHasMore) {
                            loadMoreAppointments();
                        }
                    }}
                    onEndReachedThreshold={0.4}
                    renderItem={({ item }) => {
                        const statusStyle =
                            getStatusStyle(item.status);

                        return (
                            <AppCard style={styles.apptCard}>
                                <View style={styles.apptTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.doctorName}>
                                            Dr.{" "}
                                            {item.doctorName ||
                                                item.doctorEmployeeId ||
                                                "Doctor"}
                                        </Text>

                                        <Text style={styles.apptDate}>
                                            {formatDateDisplay(item.date)}
                                            {" • "}
                                            {item.timeSlot || "—"}
                                        </Text>

                                        {item.reason ? (
                                            <Text style={styles.apptReason}>
                                                {item.reason}
                                            </Text>
                                        ) : null}
                                    </View>

                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor:
                                                    statusStyle.bg,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                {
                                                    color:
                                                        statusStyle.text,
                                                },
                                            ]}
                                        >
                                            {item.status || "—"}
                                        </Text>
                                    </View>
                                </View>

                                {(canEdit(item.status) ||
                                    canCancel(item.status)) && (
                                        <View style={styles.btnRow}>
                                            {canEdit(item.status) && (
                                                <View style={{ flex: 1 }}>
                                                    <AppButton
                                                        title="Edit"
                                                        onPress={() =>
                                                            navigation.navigate(
                                                                "EditAppointment",
                                                                {
                                                                    appointment:
                                                                        item,
                                                                }
                                                            )
                                                        }
                                                        style={styles.actionBtn}
                                                    />
                                                </View>
                                            )}

                                            {canCancel(item.status) && (
                                                <View style={{ flex: 1 }}>
                                                    <AppButton
                                                        title="Cancel"
                                                        color={COLORS.dangerLight}
                                                        textColor={COLORS.danger}
                                                        onPress={() =>
                                                            handleCancel(
                                                                item.appointmentId
                                                            )
                                                        }
                                                        style={styles.actionBtn}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    )}
                            </AppCard>
                        );
                    }}
                />
            )}
        </AppContainer>
    );
}

function getStatusStyle(status) {
    switch (status) {
        case "BOOKED":
            return {
                bg: COLORS.bookedLight,
                text: COLORS.booked,
            };

        case "PENDING":
            return {
                bg: COLORS.warningLight || "#FEF3C7",
                text: COLORS.warning || "#D97706",
            };

        case "COMPLETED":
            return {
                bg: COLORS.primaryLight,
                text: COLORS.primaryMid,
            };

        case "CANCELLED":
            return {
                bg: COLORS.dangerLight,
                text: COLORS.danger,
            };

        default:
            return {
                bg: "#F1F5F9",
                text: COLORS.subtitle,
            };
    }
}

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: "row",
        marginHorizontal: 20,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 4,
        marginBottom: 16,
    },

    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },

    tabActive: {
        backgroundColor: COLORS.primary,
    },

    tabText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.subtitle,
    },

    tabTextActive: {
        color: "#fff",
    },

    listHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 10,
    },

    listTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: COLORS.text,
    },

    listCount: {
        fontSize: 13,
        color: COLORS.subtitle,
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    apptCard: {
        marginBottom: 12,
    },

    apptTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },

    doctorName: {
        fontSize: 17,
        fontWeight: "800",
        color: COLORS.text,
    },

    apptDate: {
        fontSize: 13,
        color: COLORS.subtitle,
        marginTop: 4,
    },

    apptReason: {
        fontSize: 13,
        color: COLORS.text,
        marginTop: 6,
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },

    statusText: {
        fontSize: 12,
        fontWeight: "800",
    },

    btnRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },

    actionBtn: {
        paddingVertical: 11,
    },

    emptyText: {
        textAlign: "center",
        marginTop: 50,
        color: COLORS.subtitle,
    },

    footerLoader: {
        paddingVertical: 18,
        alignItems: "center",
    },
});

MyAppointmentsScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
