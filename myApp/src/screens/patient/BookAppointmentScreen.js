import React, { useEffect, useState, useMemo } from "react";
import PropTypes from "prop-types";
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
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
            loadDoctorSlots(selectedDoctor.employeeCode, formatDateForApi(date));
        }
    }, [selectedDoctor, date, loadDoctorSlots]);

    const filteredDoctors = doctors;
    const allSlots = doctorSlots.allSlots || [];

    const isBookedSlot = (slot) => {
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
        Keyboard.dismiss();
    };

    const handleChangeDoctor = () => {
        setSelectedDoctor(null);
        setSearch("");
        setTimeSlot("");
        setSlotError("");
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

    const handleBook = async () => {
        Keyboard.dismiss();
        if (!selectedDoctor) {
            Alert.alert("Validation Error", "Please select a doctor.");
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
        if (selectedDoctor.joiningDate) {
            const selectedDate = normalizeDateOnly(date);
            const joiningDate = normalizeDateOnly(selectedDoctor.joiningDate);
            if (selectedDate < joiningDate) {
                Alert.alert("Invalid Date", "Appointment cannot be booked before doctor's joining date.");
                return;
            }
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
            await bookAppointment({
                doctorEmployeeId: selectedDoctor.employeeCode,
                date: formatDateForApi(date),
                timeSlot,
                reason: reason.trim(),
            });
            Alert.alert("Success", "Appointment booked successfully.");
            navigation.navigate("MainTabs", { screen: "MyAppointments" });
        } catch (err) {
            Alert.alert("Booking Failed", err?.response?.data?.message || "Unable to book appointment.");
        } finally {
            setLoading(false);
        }
    };

    const renderDoctorSearch = () => (
        <View style={styles.section}>
            <Text style={styles.fieldLabel}>Choose Doctor</Text>
            <AppInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or specialization"
                autoCorrect={false}
            />
            {search.length > 0 && (
                <View style={styles.suggestBox}>
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.slice(0, 6).map((doctor, index) => (
                            <TouchableOpacity
                                key={doctor.employeeCode || doctor._id}
                                style={[
                                    styles.suggestItem,
                                    index === filteredDoctors.slice(0, 6).length - 1 && styles.lastSuggestItem
                                ]}
                                onPress={() => handleSelectDoctor(doctor)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.suggestName}>Dr. {doctor.name}</Text>
                                <Text style={styles.suggestSpec}>{doctor.specialization || "Doctor"}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.noResults}>No doctors found</Text>
                    )}
                </View>
            )}
        </View>
    );

    const renderSelectedDoctor = () => (
        <View style={styles.section}>
            <View style={styles.selectedDoctorHeader}>
                <Text style={styles.fieldLabel}>Selected Doctor</Text>
                <TouchableOpacity onPress={handleChangeDoctor} activeOpacity={0.7}>
                    <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.selectedDoctorBox}>
                <AppAvatar name={selectedDoctor.name} size={48} />
                <View style={styles.doctorInfo}>
                    <Text style={styles.sdName}>Dr. {selectedDoctor.name}</Text>
                    <Text style={styles.sdSpec}>{selectedDoctor.specialization || "Doctor"}</Text>
                </View>
                <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Selected</Text>
                </View>
            </View>
        </View>
    );

    const renderTimeSlots = () => {
        if (slotsLoading) {
            return <ActivityIndicator color={COLORS.primary} style={styles.loader} />;
        }
        if (!selectedDoctor) {
            return (
                <View style={styles.slotsEmpty}>
                    <Text style={styles.slotsEmptyText}>Select a doctor to view slots</Text>
                </View>
            );
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
            <KeyboardAvoidingView 
                style={styles.keyboardAvoid} 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                            {selectedDoctor ? renderSelectedDoctor() : renderDoctorSearch()}

                            <View style={styles.section}>
                                <Text style={styles.fieldLabel}>Appointment Date</Text>
                                <TouchableOpacity
                                    style={styles.dateBtn}
                                    onPress={() => setShowDatePicker(true)}
                                    disabled={loading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.dateBtnText}>📅 {formatDateDisplay(date)}</Text>
                                </TouchableOpacity>
                                <Text style={styles.dateHint}>Appointments can be booked from today onwards</Text>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        minimumDate={getTodayDate()}
                                        onChange={handleDateChange}
                                    />
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.fieldLabel}>Time Slots</Text>
                                {renderTimeSlots()}
                                {slotError ? <Text style={styles.inlineError}>{slotError}</Text> : null}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.fieldLabel}>Reason</Text>
                                <AppInput
                                    value={reason}
                                    onChangeText={setReason}
                                    placeholder="Enter reason for visit"
                                    multiline
                                    numberOfLines={3}
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                            </View>

                            <AppButton
                                title="Book Appointment"
                                onPress={handleBook}
                                loading={loading}
                                disabled={loading}
                                style={styles.bookBtn}
                            />
                        </AppCard>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
            doctor: PropTypes.object,
        }),
    }),
};

BookAppointmentScreen.defaultProps = {
    route: { params: { doctor: null } },
};

const styles = StyleSheet.create({
    keyboardAvoid: {
        flex: 1,
    },
    scroll: {
        paddingBottom: 40,
    },
    card: {
        marginHorizontal: 20,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    fieldLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 8,
    },
    selectedDoctorHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    changeText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: "600",
    },
    selectedDoctorBox: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: COLORS.primaryMid,
        borderRadius: 14,
        padding: 12,
        backgroundColor: COLORS.primaryLight,
        gap: 12,
    },
    doctorInfo: {
        flex: 1,
    },
    sdName: {
        fontSize: 16,
        fontWeight: "700",
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
        color: COLORS.white,
        fontSize: 12,
        fontWeight: "700",
    },
    suggestBox: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginTop: 8,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    suggestItem: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    lastSuggestItem: {
        borderBottomWidth: 0,
    },
    suggestName: {
        fontSize: 15,
        fontWeight: "700",
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
        fontSize: 14,
    },
    dateBtn: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        justifyContent: "center",
    },
    dateBtnText: {
        fontSize: 15,
        color: COLORS.text,
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
    bookBtn: {
        marginTop: 10,
    },
});