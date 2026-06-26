import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import AppAvatar from "../../components/AppAvatar";
import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import AppInput from "../../components/AppInput";
import ScreenHeader from "../../components/ScreenHeader";

import { useAppointments } from "../../context/AppointmentContext";
import COLORS from "../../utils/colors";

import {
    formatDateDisplay,
    formatDateForApi,
    formatDateDisplay,
    formatDateForApi,
    getTodayDate,
    normalizeDateOnly,
} from "../../utils/dateUtils";

import { isTodayOrFuture } from "../../utils/validators";

export default function BookAppointmentScreen({ navigation, route }) {
    const preselectedDoctor = route?.params?.doctor || null;

    const {
        doctors,
        doctorSlots,
        slotsLoading,
        loadDoctors,
        loadDoctorSlots,
        bookAppointment,
    } = useAppointments();

    const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctor);
    const [search, setSearch] = useState("");
    const [date, setDate] = useState(getTodayDate());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [timeSlot, setTimeSlot] = useState("");
    const [reason, setReason] = useState("");
    const [slotError, setSlotError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (search.trim().length > 0) {
                loadDoctors(search.trim());
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [search, loadDoctors]);

    useEffect(() => {
        if (preselectedDoctor) {
            setSelectedDoctor(preselectedDoctor);
            setTimeSlot("");
        }
    }, [preselectedDoctor]);

    useEffect(() => {
        if (selectedDoctor?.employeeCode && date) {
            loadDoctorSlots(
                selectedDoctor.employeeCode,
                formatDateForApi(date)
            );
        }
    }, [selectedDoctor, date, loadDoctorSlots]);

    const filteredDoctors = doctors;

    const allSlots = doctorSlots.allSlots || [];

    const isBookedSlot = (slot) => {
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
    console.log("DOCTOR SLOTS:", doctorSlots);
    console.log("BOOKED SLOTS:", doctorSlots.bookedSlots);
    console.log("ALL SLOTS:", allSlots);
    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === "android") {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            setDate(selectedDate);
            setTimeSlot("");
            setSlotError("");
        }

        if (Platform.OS === "ios") {
            setShowDatePicker(false);
        }
    };

    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        setSearch("");
        setTimeSlot("");
        setSlotError("");
    };

    const handleChangeDoctor = () => {
        setSelectedDoctor(null);
        setSearch("");
        setTimeSlot("");
        setSlotError("");
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

    const handleBook = async () => {
        if (!selectedDoctor) {
            Alert.alert("Validation Error", "Please select a doctor");
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

        if (selectedDoctor.joiningDate) {
            const selectedDate = normalizeDateOnly(date);
            const joiningDate = normalizeDateOnly(selectedDoctor.joiningDate);

            if (selectedDate < joiningDate) {
                Alert.alert(
                    "Invalid Date",
                    "Appointment cannot be booked before doctor's joining date"
                );
                return;
            }
        }

        if (!timeSlot) {
            setSlotError("Time slot is required");
            Alert.alert("Validation Error", "Please select a time slot");
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

            await bookAppointment({
                doctorEmployeeId: selectedDoctor.employeeCode,
                date: formatDateForApi(date),
                timeSlot,
                reason: reason.trim(),
            });

            Alert.alert("Success", "Appointment booked successfully");

            navigation.navigate("MainTabs", {
                screen: "MyAppointments",
            });
        } catch (err) {
            Alert.alert(
                "Booking Failed",
                err?.response?.data?.message || "Unable to book appointment"
            );
        } finally {
            setLoading(false);
        }
    };

    const renderDoctorSearch = () => (
        <>
            <Text style={styles.fieldLabel}>Choose Doctor</Text>

            <AppInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or specialization"
            />

            {search.length > 0 && (
                <View style={styles.suggestBox}>
                    {filteredDoctors.slice(0, 6).map((doctor) => (
                        <TouchableOpacity
                            key={doctor.employeeCode || doctor._id}
                            style={styles.suggestItem}
                            onPress={() => handleSelectDoctor(doctor)}
                        >
                            <Text style={styles.suggestName}>
                                Dr. {doctor.name}
                            </Text>

                            <Text style={styles.suggestSpec}>
                                {doctor.specialization || "Doctor"}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    {filteredDoctors.length === 0 && (
                        <Text style={styles.noResults}>No doctors found</Text>
                    )}
                </View>
            )}
        </>
    );

    const renderSelectedDoctor = () => (
        <View>
            <Text style={styles.fieldLabel}>Selected Doctor</Text>

            <View style={styles.selectedDoctorBox}>
                <AppAvatar name={selectedDoctor.name} size={42} />

                <View style={styles.doctorInfo}>
                    <Text style={styles.sdName}>
                        Dr. {selectedDoctor.name}
                    </Text>

                    <Text style={styles.sdSpec}>
                        {selectedDoctor.specialization || "Doctor"}
                    </Text>
                </View>

                <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
            </View>

            <TouchableOpacity onPress={handleChangeDoctor}>
                <Text style={styles.changeText}>Change Doctor</Text>
            </TouchableOpacity>
        </View>
    );

    const renderTimeSlots = () => {
        if (slotsLoading) {
            return (
                <ActivityIndicator
                    color={COLORS.primary}
                    style={styles.loader}
                />
            );
        }

        if (!selectedDoctor) {
            return (
                <View style={styles.slotsEmpty}>
                    <Text style={styles.slotsEmptyText}>
                        Select doctor to view slots
                    </Text>
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
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scroll}
            >
                <ScreenHeader
                    title="Book Appointment"
                    subtitle="Choose doctor, date and time slot"
                    goBack={() => navigation.goBack()}
                />

                <AppCard style={styles.card}>
                    {selectedDoctor
                        ? renderSelectedDoctor()
                        : renderDoctorSearch()}

                    <Text style={styles.fieldLabel}>Appointment Date</Text>

                    <TouchableOpacity
                        style={styles.dateBtn}
                        onPress={() => setShowDatePicker(true)}
                        disabled={loading}
                    >
                        <Text style={styles.dateBtnText}>
                            📅 {formatDateDisplay(date)}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.dateHint}>
                        Appointments can be booked from today onwards
                    </Text>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            minimumDate={getTodayDate()}
                            onChange={handleDateChange}
                        />
                    )}

                    <Text style={styles.fieldLabel}>Time Slots</Text>

                    {renderTimeSlots()}

                    {slotError ? (
                        <Text style={styles.inlineError}>{slotError}</Text>
                    ) : null}

                    <Text style={styles.fieldLabel}>Reason</Text>

                    <AppInput
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Enter reason for visit"
                        multiline
                        numberOfLines={4}
                    />

                    <AppButton
                        title="Book Appointment"
                        onPress={handleBook}
                        loading={loading}
                        disabled={loading}
                        style={styles.bookBtn}
                    />
                </AppCard>
            </ScrollView>
        </AppContainer>
    );
}

BookAppointmentScreen.propTypes = {
    navigation: PropTypes.shape({
        navigate: PropTypes.func.isRequired,
        goBack: PropTypes.func.isRequired,
    }).isRequired,

    route: PropTypes.shape({
        params: PropTypes.shape({
            doctor: PropTypes.shape({
                _id: PropTypes.string,
                employeeCode: PropTypes.string,
                name: PropTypes.string,
                specialization: PropTypes.string,
                joiningDate: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.instanceOf(Date),
                ]),
                availabilitySlots: PropTypes.arrayOf(PropTypes.string),
            }),
        }),
    }),
};

BookAppointmentScreen.defaultProps = {
    route: {
        params: {
            doctor: null,
        },
    },
};

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
    },

    card: {
        marginHorizontal: 20,
    },

    fieldLabel: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 16,
    },

    selectedDoctorBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: COLORS.primaryMid,
        borderRadius: 14,
        padding: 12,
        backgroundColor: "#EEF4FF",
        gap: 12,
    },

    doctorInfo: {
        flex: 1,
    },

    sdName: {
        fontSize: 16,
        fontWeight: "800",
        color: COLORS.primaryMid,
    },

    sdSpec: {
        fontSize: 13,
        color: COLORS.subtitle,
        marginTop: 2,
    },

    selectedBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },

    selectedBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "800",
    },

    changeText: {
        color: COLORS.primary,
        marginTop: 8,
        fontWeight: "800",
    },

    suggestBox: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: "hidden",
    },

    suggestItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },

    suggestName: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
    },

    suggestSpec: {
        fontSize: 13,
        color: COLORS.primaryMid,
        marginTop: 2,
    },

    noResults: {
        padding: 14,
        color: COLORS.subtitle,
        textAlign: "center",
    },

    dateBtn: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },

    dateBtnText: {
        fontSize: 15,
        color: COLORS.text,
        fontWeight: "700",
    },

    dateHint: {
        fontSize: 12,
        color: COLORS.subtitle,
        marginTop: 4,
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

    slotsEmpty: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    slotsEmptyText: {
        color: COLORS.subtitle,
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

    bookBtn: {
        marginTop: 24,
    },
});