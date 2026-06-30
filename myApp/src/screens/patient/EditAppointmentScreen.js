import React, { useEffect, useState, useMemo } from "react";
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

        return (
            Array.isArray(doctorSlots.bookedSlots) &&
            doctorSlots.bookedSlots.some(
                (bookedSlot) =>
                    bookedSlot?.trim().toLowerCase() === slot?.trim().toLowerCase()
            )
        );
    };

    const isPastSlot = (slot) => {
        return (
            Array.isArray(doctorSlots.pastSlots) &&
            doctorSlots.pastSlots.some(
                (pastSlot) =>
                    pastSlot?.trim().toLowerCase() === slot?.trim().toLowerCase()
            )
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

    const handleSelectSlot = (slot, disabled) => {
        if (disabled) {
            if (isBookedSlot(slot)) {
                Alert.alert("Slot Booked", "This slot is already booked. Please select another slot.");
            }
            return;
        }
        setTimeSlot(slot);
        setSlotError("");
    };

    const handleUpdate = async () => {
        if (!appointment?.appointmentId) {
            Alert.alert("Error", "Appointment ID missing.");
            return;
        }
        if (!["PENDING", "BOOKED"].includes(appointment.status)) {
            Alert.alert("Not Allowed", "Only pending or booked appointments can be edited.");
            return;
        }
        if (!date) {
            Alert.alert("Validation Error", "Please select an appointment date.");
            return;
        }
        if (!isTodayOrFuture(date)) {
            Alert.alert("Invalid Date", "Appointment date must be today or a future date.");
            return;
        }
        if (!timeSlot) {
            setSlotError("Time slot is required.");
            Alert.alert("Validation Error", "Please select a time slot.");
            return;
        }
        if (isBookedSlot(timeSlot)) {
            setSlotError("This slot is already booked.");
            Alert.alert("Slot Booked", "This slot is already booked. Please select another slot.");
            return;
        }

        try {
            setLoading(true);
            await updateAppointment(appointment.appointmentId, {
                date: formatDateForApi(date),
                timeSlot,
            });
            Alert.alert("Success", "Appointment updated successfully.");
            navigation.goBack();
        } catch (err) {
            Alert.alert("Error", err?.response?.data?.message || "Update failed.");
        } finally {
            setLoading(false);
        }
    };

    const renderSlots = () => {
        if (slotsLoading) {
            return <ActivityIndicator color={COLORS.primary} style={styles.loader} />;
        }
        if (allSlots.length === 0) {
            return (
                <View style={styles.slotsEmpty}>
                    <Text style={styles.slotsEmptyText}>No slots available for this date</Text>
                </View>
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
                            activeOpacity={0.7}
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
                <View style={styles.section}>
                    <Text style={styles.label}>Appointment Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowPicker(true)}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dateText}>📅 {formatDateDisplay(date)}</Text>
                    </TouchableOpacity>
                    <Text style={styles.dateHint}>Appointments can be rescheduled from today onwards</Text>
                    {showPicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            minimumDate={getTodayDate()}
                            onChange={handleDateChange}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Time Slot</Text>
                    {renderSlots()}
                    {slotError ? <Text style={styles.inlineError}>{slotError}</Text> : null}
                </View>

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
            appointment: PropTypes.object,
        }),
    }),
};

EditAppointmentScreen.defaultProps = {
    route: { params: { appointment: null } },
};

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 8,
    },
    dateButton: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: "center",
    },
    dateText: {
        color: COLORS.text,
        fontSize: 15,
        fontWeight: "600",
    },
    dateHint: {
        fontSize: 12,
        color: COLORS.subtitle,
        marginTop: 6,
    },
    slotsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    slotChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    slotChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    slotChipDisabled: {
        backgroundColor: COLORS.disabledBg,
        borderColor: COLORS.border,
        opacity: 0.7,
    },
    slotText: {
        fontSize: 13,
        fontWeight: "600",
        color: COLORS.text,
    },
    slotTextActive: {
        color: COLORS.white,
    },
    slotTextDisabled: {
        color: COLORS.disabledText,
    },
    slotsEmpty: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: "dashed",
    },
    slotsEmptyText: {
        color: COLORS.subtitle,
        fontSize: 14,
        fontWeight: "500",
    },
    inlineError: {
        marginTop: 8,
        color: COLORS.danger,
        fontSize: 13,
        fontWeight: "600",
    },
    loader: {
        marginVertical: 20,
    },
    button: {
        marginTop: 10,
    },
});