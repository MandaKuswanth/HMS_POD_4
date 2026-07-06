import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import AppointmentSlots from "../../components/AppointmentSlots";

import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
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

import { isTomorrowOrFuture } from "../../utils/validators";

const DEFAULT_TIME_SLOTS = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
];

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
        appointment?.date ? new Date(appointment.date) : getTomorrowDate()
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
        const doctorId = appointment?.doctorEmployeeId || doctor?.employeeCode;

        if (doctorId && date) {
            loadDoctorSlots(doctorId, formatDateForApi(date), fallbackSlots);
        }
    }, [appointment, doctor, date, fallbackSlots, loadDoctorSlots]);

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
        const sameSlot = slot === appointment?.timeSlot;
        const sameDate =
            formatDateForApi(date) === formatDateForApi(appointment?.date);

        if (sameSlot && sameDate) {
            return false;
        }

        return doctorSlots.bookedSlots?.includes(slot);
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

        if (!isTomorrowOrFuture(date)) {
            Alert.alert(
                "Invalid Date",
                "Appointment date must be tomorrow or future date"
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

                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        minimumDate={getTomorrowDate()}
                        onChange={handleDateChange}
                    />
                )}

                <Text style={styles.label}>Time Slot</Text>
<AppointmentSlots
    loading={slotsLoading}
    slots={allSlots}
    selectedSlot={timeSlot}
    isBookedSlot={isBookedSlot}
    onSelectSlot={handleSelectSlot}
/>

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