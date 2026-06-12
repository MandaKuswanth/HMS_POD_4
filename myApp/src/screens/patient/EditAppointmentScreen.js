import React, { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import ScreenHeader from "../../components/ScreenHeader";

import { useAppointments } from "../../context/AppointmentContext";

import COLORS from "../../utils/colors";

import {
    formatDateDisplay,
    formatDateForApi,
    getTomorrowDate,
} from "../../utils/dateUtils";

import {
    isTomorrowOrFuture,
} from "../../utils/validators";

const DEFAULT_TIME_SLOTS = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
];

export default function EditAppointmentScreen({
    navigation,
    route,
}) {
    const appointment =
        route?.params?.appointment;

    const {
        doctors,
        doctorSlots,
        slotsLoading,
        loadDoctors,
        loadDoctorSlots,
        updateAppointment,
    } = useAppointments();

    const [date, setDate] =
        useState(
            appointment?.date
                ? new Date(appointment.date)
                : getTomorrowDate()
        );

    const [timeSlot, setTimeSlot] =
        useState(appointment?.timeSlot || "");

    const [showPicker, setShowPicker] =
        useState(false);

    const [slotError, setSlotError] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    const doctor = useMemo(() => {
        return doctors.find((d) => {
            return (
                d.employeeCode ===
                appointment?.doctorEmployeeId ||
                d.employeeCode ===
                appointment?.doctor?.employeeCode
            );
        });
    }, [doctors, appointment]);

    const fallbackSlots = useMemo(() => {
        if (
            Array.isArray(doctor?.availabilitySlots) &&
            doctor.availabilitySlots.length > 0
        ) {
            return doctor.availabilitySlots;
        }

        return DEFAULT_TIME_SLOTS;
    }, [doctor]);

    useEffect(() => {
        const doctorId =
            appointment?.doctorEmployeeId ||
            doctor?.employeeCode;

        if (doctorId && date) {
            loadDoctorSlots(
                doctorId,
                formatDateForApi(date),
                fallbackSlots
            );
        }
    }, [
        appointment,
        doctor,
        date,
        fallbackSlots,
        loadDoctorSlots,
    ]);

    const allSlots = useMemo(() => {
        if (
            Array.isArray(doctorSlots.allSlots) &&
            doctorSlots.allSlots.length > 0
        ) {
            return doctorSlots.allSlots;
        }

        return fallbackSlots;
    }, [doctorSlots, fallbackSlots]);

    const isBookedSlot = (slot) => {
        const ownSlot =
            slot === appointment?.timeSlot &&
            formatDateForApi(date) ===
            formatDateForApi(appointment?.date);

        if (ownSlot) return false;

        return doctorSlots.bookedSlots?.includes(slot);
    };

    const handleUpdate = async () => {
        if (!appointment?.appointmentId) {
            Alert.alert(
                "Error",
                "Appointment ID missing"
            );
            return;
        }

        if (
            !["PENDING", "BOOKED"].includes(
                appointment.status
            )
        ) {
            Alert.alert(
                "Not Allowed",
                "Only pending or booked appointments can be edited"
            );
            return;
        }

        if (!date) {
            Alert.alert(
                "Validation Error",
                "Please select appointment date"
            );
            return;
        }

        if (!isTomorrowOrFuture(date)) {
            Alert.alert(
                "Invalid Date",
                "Appointment date must be tomorrow or future date"
            );
            return;
        }

        if (!timeSlot) {
            setSlotError("Time slot is required");

            Alert.alert(
                "Validation Error",
                "Please select time slot"
            );
            return;
        }

        if (isBookedSlot(timeSlot)) {
            setSlotError("This slot is already booked");

            Alert.alert(
                "Slot Booked",
                "This slot is already booked. Please select another slot."
            );
            return;
        }

        try {
            setLoading(true);

            await updateAppointment(
                appointment.appointmentId,
                {
                    date: formatDateForApi(date),
                    timeSlot,
                }
            );

            Alert.alert(
                "Success",
                "Appointment updated successfully"
            );

            navigation.goBack();
        } catch (err) {
            Alert.alert(
                "Error",
                err?.response?.data?.message ||
                "Update failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="Edit Appointment"
                subtitle="Update your appointment date and time"
                goBack={() => navigation.goBack()}
            />

            <AppCard style={styles.card}>
                <Text style={styles.label}>
                    Appointment Date
                </Text>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowPicker(true)}
                    disabled={loading}
                >
                    <Text style={styles.dateText}>
                        📅 {formatDateDisplay(date)}
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        minimumDate={getTomorrowDate()}
                        onChange={(
                            event,
                            selectedDate
                        ) => {
                            if (Platform.OS === "android") {
                                setShowPicker(false);
                            }

                            if (selectedDate) {
                                setDate(selectedDate);
                                setTimeSlot("");
                                setSlotError("");
                            }

                            if (Platform.OS === "ios") {
                                setShowPicker(false);
                            }
                        }}
                    />
                )}

                <Text style={styles.label}>
                    Time Slot
                </Text>

                {slotsLoading ? (
                    <ActivityIndicator
                        color={COLORS.primary}
                        style={{ marginVertical: 12 }}
                    />
                ) : (
                    <View style={styles.slotsGrid}>
                        {allSlots.map((slot) => {
                            const booked =
                                isBookedSlot(slot);

                            const selected =
                                timeSlot === slot;

                            return (
                                <TouchableOpacity
                                    key={slot}
                                    disabled={booked}
                                    style={[
                                        styles.slotChip,
                                        selected &&
                                        styles.slotChipActive,
                                        booked &&
                                        styles.slotChipDisabled,
                                    ]}
                                    onPress={() => {
                                        if (booked) {
                                            Alert.alert(
                                                "Slot Booked",
                                                "This slot is already booked. Please select another slot."
                                            );
                                            return;
                                        }

                                        setTimeSlot(slot);
                                        setSlotError("");
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.slotText,
                                            selected &&
                                            styles.slotTextActive,
                                            booked &&
                                            styles.slotTextDisabled,
                                        ]}
                                    >
                                        {slot}{" "}
                                        {booked
                                            ? "(Booked)"
                                            : ""}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {slotError ? (
                    <Text style={styles.inlineError}>
                        {slotError}
                    </Text>
                ) : null}

                <AppButton
                    title="Update Appointment"
                    onPress={handleUpdate}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                />
            </AppCard>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
    },

    label: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 10,
        marginTop: 12,
    },

    dateButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        backgroundColor: COLORS.surface,
    },

    dateText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: "700",
    },

    slotsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    slotChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    slotChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },

    slotChipDisabled: {
        backgroundColor: COLORS.disabledBg || "#E5E7EB",
        borderColor: COLORS.disabledBg || "#E5E7EB",
        opacity: 0.9,
    },

    slotText: {
        fontSize: 13,
        fontWeight: "800",
        color: COLORS.text,
    },

    slotTextActive: {
        color: "#fff",
    },

    slotTextDisabled: {
        color: COLORS.disabledText || "#9CA3AF",
    },

    inlineError: {
        marginTop: 8,
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: "700",
    },

    button: {
        marginTop: 25,
    },
});