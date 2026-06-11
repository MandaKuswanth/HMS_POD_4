import React, {
    useEffect,
    useState
} from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView
} from "react-native";

import { Picker }
    from "@react-native-picker/picker";

import DateTimePicker
    from "@react-native-community/datetimepicker";

import {
    getDoctors,
    bookAppointment
} from "../../services/appointmentService";

import COLORS
    from "../../utils/colors";

import AppContainer
    from "../../components/AppContainer";

import AppCard
    from "../../components/AppCard";

import AppButton
    from "../../components/AppButton";

import AppHeader
    from "../../components/AppHeader";

export default function BookAppointmentScreen({
    token,
    goBack
}) {

    const [doctors, setDoctors] = useState([]);

    const [doctorEmployeeId,
        setDoctorEmployeeId] = useState("");

    const [date,
        setDate] = useState(new Date());

    const [showDatePicker,
        setShowDatePicker] = useState(false);

    const [timeSlot,
        setTimeSlot] = useState("");

    const [loading,
        setLoading] = useState(false);

    useEffect(() => {

        loadDoctors();

    }, []);

    const loadDoctors = async () => {

        try {

            const response =
                await getDoctors(token);

            setDoctors(response.data);

        } catch (err) {

            console.log(err);

        }
    };

    const handleBookAppointment =
        async () => {

            if (
                !doctorEmployeeId ||
                !timeSlot
            ) {

                Alert.alert(
                    "Error",
                    "Please fill all fields"
                );

                return;
            }

            try {

                setLoading(true);

                await bookAppointment(
                    {
                        doctorEmployeeId,
                        date,
                        timeSlot
                    },
                    token
                );

                Alert.alert(
                    "Success",
                    "Appointment booked successfully"
                );

                goBack();

            } catch (err) {

                Alert.alert(
                    "Error",
                    err?.response?.data?.message ||
                    "Unable to book appointment"
                );

            } finally {

                setLoading(false);
            }
        };

    return (

        <AppContainer>

            <ScrollView
                showsVerticalScrollIndicator={false}
            >

                <AppHeader
                    title="Book Appointment"
                    subtitle="Schedule your consultation"
                    onBack={goBack}
                />

                <AppCard style={styles.summaryCard}>

                    <Text style={styles.summaryLabel}>
                        Appointment Booking
                    </Text>

                    <Text style={styles.summaryValue}>
                        Schedule your consultation
                    </Text>

                </AppCard>

                <AppCard>

                    <Text style={styles.label}>
                        Select Doctor
                    </Text>

                    <View
                        style={styles.pickerContainer}
                    >

                        <Picker
                            selectedValue={
                                doctorEmployeeId
                            }
                            onValueChange={
                                setDoctorEmployeeId
                            }
                        >

                            <Picker.Item
                                label="Choose Doctor"
                                value=""
                            />

                            {
                                doctors.map(
                                    (doctor) => (

                                        <Picker.Item
                                            key={
                                                doctor.employeeCode
                                            }
                                            label={
                                                `${doctor.name} (${doctor.specialization})`
                                            }
                                            value={
                                                doctor.employeeCode
                                            }
                                        />
                                    )
                                )
                            }

                        </Picker>

                    </View>

                    <Text style={styles.label}>
                        Appointment Date
                    </Text>

                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() =>
                            setShowDatePicker(
                                true
                            )
                        }
                    >

                        <Text style={styles.dateText}>
                            📅 {date.toDateString()}
                        </Text>

                    </TouchableOpacity>

                    {
                        showDatePicker && (

                            <DateTimePicker
                                value={date}
                                mode="date"
                                minimumDate={
                                    new Date()
                                }
                                onChange={(
                                    event,
                                    selectedDate
                                ) => {

                                    setShowDatePicker(
                                        false
                                    );

                                    if (
                                        selectedDate
                                    ) {

                                        setDate(
                                            selectedDate
                                        );
                                    }
                                }}
                            />
                        )
                    }

                    <Text style={styles.label}>
                        Time Slot
                    </Text>

                    <View
                        style={styles.pickerContainer}
                    >

                        <Picker
                            selectedValue={
                                timeSlot
                            }
                            onValueChange={
                                setTimeSlot
                            }
                        >

                            <Picker.Item
                                label="Choose Slot"
                                value=""
                            />

                            <Picker.Item
                                label="09:00 AM"
                                value="09:00 AM"
                            />

                            <Picker.Item
                                label="10:00 AM"
                                value="10:00 AM"
                            />

                            <Picker.Item
                                label="11:00 AM"
                                value="11:00 AM"
                            />

                            <Picker.Item
                                label="12:00 PM"
                                value="12:00 PM"
                            />

                        </Picker>

                    </View>

                    <View
                        style={styles.buttonContainer}
                    >

                        <AppButton
                            title={
                                loading
                                    ? "Booking..."
                                    : "Book Appointment"
                            }
                            onPress={
                                handleBookAppointment
                            }
                        />

                    </View>

                </AppCard>

            </ScrollView>

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    summaryCard: {
        marginBottom: 15,
        backgroundColor: COLORS.primary
    },

    summaryLabel: {
        color: COLORS.primaryLight,
        fontSize: 14
    },

    summaryValue: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: "700",
        marginTop: 5
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 15
    },

    pickerContainer: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: COLORS.white
    },

    dateButton: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        backgroundColor: COLORS.white
    },

    dateText: {
        color: COLORS.text,
        fontWeight: "600"
    },

    buttonContainer: {
        marginTop: 25
    }

});