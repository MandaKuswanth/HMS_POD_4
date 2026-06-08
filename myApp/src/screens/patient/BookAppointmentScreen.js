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

import { Picker } from "@react-native-picker/picker";

import DateTimePicker
    from "@react-native-community/datetimepicker";

import { SafeAreaView }
    from "react-native-safe-area-context";

import {
    getDoctors,
    bookAppointment
} from "../../services/appointmentService";

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
                    "Appointment request submitted"
                );

                goBack();

            } catch (err) {

                console.log(err);

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

        <SafeAreaView
            style={styles.container}
        >

            <ScrollView>

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
                    Confirm Appointment
                </Text>
                <View style={styles.summaryCard}>

                    <Text style={styles.summaryTitle}>
                        Appointment Booking
                    </Text>

                    <Text style={styles.summaryValue}>
                        Schedule a consultation
                    </Text>

                </View>

                <Text
                    style={styles.label}
                >
                    Doctor
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
                            label="Select Doctor"
                            value=""
                        />

                        {
                            doctors.map(
                                doctor => (

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

                <Text
                    style={styles.label}
                >
                    Appointment Date
                </Text>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() =>
                        setShowDatePicker(true)
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
                            maximumDate={
                                new Date(
                                    new Date().setMonth(
                                        new Date().getMonth() + 1
                                    )
                                )
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

                <Text
                    style={styles.label}
                >
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
                            label="Select Slot"
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

                <TouchableOpacity
                    style={styles.button}
                    onPress={
                        handleBookAppointment
                    }
                    disabled={loading}
                >

                    <Text
                        style={styles.buttonText}
                    >

                        {
                            loading
                                ? "Booking..."
                                : "Book Appointment"
                        }

                    </Text>

                </TouchableOpacity>

            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
        padding: 20
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
        marginTop: 20,
        marginBottom: 10
    },

    subtitle: {
        color: "#64748B",
        marginBottom: 20
    },

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#334155",
        marginBottom: 8,
        marginTop: 15
    },

    pickerContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        overflow: "hidden",

        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2
    },

    dateButton: {
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",

        shadowColor: "#000",
        shadowOpacity: 0.03,
        shadowRadius: 5,
        elevation: 2
    },

    dateText: {
        color: "#0F172A",
        fontWeight: "600"
    },

    summaryCard: {
        backgroundColor: "#0F766E",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20
    },

    summaryTitle: {
        color: "#CCFBF1",
        fontSize: 14
    },

    summaryValue: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "700",
        marginTop: 5
    },

    button: {
        backgroundColor: "#0F766E",
        paddingVertical: 18,
        borderRadius: 16,
        marginTop: 30,
        alignItems: "center",

        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4
    },

    buttonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 16
    }
});