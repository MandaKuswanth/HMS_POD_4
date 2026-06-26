import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

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
    getTodayDate,
} from "../../utils/dateUtils";

import { isTodayOrFuture } from "../../utils/validators";

export default function EditAppointmentScreen({ navigation, route }) {
    const appointment = route?.params?.appointment;

    const {
        doctors,
        doctorSlots,
        slotsLoading,
        loadDoctors,
        loadDoctorSlots,
        updateAppointment,
    } = useAppointments();

    const [date, setDate] = useState(
        appointment?.date ? new Date(appointment.date) : getTodayDate()
    );
    const [timeSlot, setTimeSlot] = useState(appointment?.timeSlot || "");
    const [showPicker, setShowPicker] = useState(false);
    const [slotError, setSlotError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDoctors();
    }, [loadDoctors]);

    const doctor = useMemo(() => {
        return doctors.find((item) => {
            return (
                item.employeeCode === appointment?.doctorEmployeeId ||
                item.employeeCode === appointment?.doctor?.employeeCode
            );
        });
    }, [doctors, appointment]);

    useEffect(() => {
        const doctorId = appointment?.doctorEmployeeId || doctor?.employeeCode;

        if (doctorId && date) {
            loadDoctorSlots(doctorId, formatDateForApi(date));
        }
    }, [appointment, doctor, date, loadDoctorSlots]);

    const allSlots = doctorSlots.allSlots || [];

    const isBookedSlot = (slot) => {
        const sameSlot = slot === appointment?.timeSlot;
        const sameDate =
            formatDateForApi(date) === formatDateForApi(appointment?.date);

        if (sameSlot && sameDate) {
            return false;
        }

        return Array.isArray(doctorSlots.bookedSlots) &&
            doctorSlots.bookedSlots.some(
                (bookedSlot) =>
                    bookedSlot?.trim().toLowerCase() ===
                    slot?.trim().toLowerCase()
            );
    };

    const isPastSlot = (slot) => {
        return Array.isArray(doctorSlots.pastSlots) &&
            doctorSlots.pastSlots.some(
                (pastSlot) =>
                    pastSlot?.trim().toLowerCase() ===
                    slot?.trim().toLowerCase()
            );
    };

    const handleDateChange = (event, selectedDate) => {
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
    };

    const handleSelectSlot = (slot, booked) => {
        if (booked) {
            Alert.alert(
                "Slot Booked",
                "This slot is already booked. Please select another slot."
            );
            return;
        }

        setTimeSlot(slot);
        setSlotError("");
    };

    const handleUpdate = async () => {
        if (!appointment?.appointmentId) {
            Alert.alert("Error", "Appointment ID missing");
            return;
        }

        if (!["PENDING", "BOOKED"].includes(appointment.status)) {
            Alert.alert(
                "Not Allowed",
                "Only pending or booked appointments can be edited"
            );
            return;
        }

        if (!date) {
            Alert.alert("Validation Error", "Please select appointment date");
            return;
        }

        if (!isTodayOrFuture(date)) {
            Alert.alert(
                "Invalid Date",
                "Appointment date must be today or future date"
            );
            return;
        }

        if (!timeSlot) {
            setSlotError("Time slot is required");
            Alert.alert("Validation Error", "Please select time slot");
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

            await updateAppointment(appointment.appointmentId, {
                date: formatDateForApi(date),
                timeSlot,
            });

            Alert.alert("Success", "Appointment updated successfully");

            navigation.goBack();
        } catch (err) {
            Alert.alert(
                "Error",
                err?.response?.data?.message || "Update failed"
            );
        } finally {
            setLoading(false);
        }
    };

    const renderSlots = () => {
        if (slotsLoading) {
            return (
                <ActivityIndicator
                    color={COLORS.primary}
                    style={styles.loader}
                />
            );
        }

        return (
            <View style={styles.slotsGrid}>
                {allSlots.map((slot) => {
                    const booked = isBookedSlot(slot);
                    const past = isPastSlot(slot);
                    const disabled = booked || past;
                    const selected = timeSlot === slot;
                    const slotLabel = booked ? `${slot} (Booked)` : past ? `${slot} (Past)` : slot;

                    return (
                        <TouchableOpacity
                            key={slot}
                            disabled={disabled}
                            style={[
                                styles.slotChip,
                                selected && styles.slotChipActive,
                                disabled && styles.slotChipDisabled,
                            ]}
                            onPress={() => handleSelectSlot(slot, disabled)}
                        >
                            <Text
                                style={[
                                    styles.slotText,
                                    selected && styles.slotTextActive,
                                    disabled && styles.slotTextDisabled,
                                ]}
                            >
                                {slotLabel}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader
                title="Edit Appointment"
                subtitle="Update your appointment date and time"
                goBack={() => navigation.goBack()}
            />

            <AppCard style={styles.card}>
                <Text style={styles.label}>Appointment Date</Text>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowPicker(true)}
                    disabled={loading}
                >
                    <Text style={styles.dateText}>
                        📅 {formatDateDisplay(date)}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.dateHint}>
                    Appointments can be rescheduled from today onwards
                </Text>

                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        minimumDate={getTodayDate()}
                        onChange={handleDateChange}
                    />
                )}

                <Text style={styles.label}>Time Slot</Text>

                {renderSlots()}

                {slotError ? (
                    <Text style={styles.inlineError}>{slotError}</Text>
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

EditAppointmentScreen.propTypes = {
    navigation: PropTypes.shape({
        goBack: PropTypes.func.isRequired,
    }).isRequired,

    route: PropTypes.shape({
        params: PropTypes.shape({
            appointment: PropTypes.shape({
                appointmentId: PropTypes.string,
                doctorEmployeeId: PropTypes.string,
                date: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.instanceOf(Date),
                ]),
                timeSlot: PropTypes.string,
                status: PropTypes.string,
                doctor: PropTypes.shape({
                    employeeCode: PropTypes.string,
                }),
            }),
        }),
    }),
};

EditAppointmentScreen.defaultProps = {
    route: {
        params: {
            appointment: null,
        },
    },
};

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

    loader: {
        marginVertical: 12,
    },

    button: {
        marginTop: 25,
    },
});