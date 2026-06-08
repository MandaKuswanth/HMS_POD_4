import React,
{
    useState
}
    from "react";

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
}
    from "react-native";

import DateTimePicker
    from "@react-native-community/datetimepicker";

import {
    SafeAreaView
}
    from "react-native-safe-area-context";

import {
    updateAppointment
}
    from "../../services/appointmentService";

export default function
    EditAppointmentScreen({

        appointment,

        token,

        goBack

    }) {

    const [date,
        setDate] =
        useState(
            new Date(
                appointment.date
            )
        );

    const [showPicker,
        setShowPicker] =
        useState(false);

    const handleUpdate =
        async () => {

            try {

                await updateAppointment(

                    appointment
                        .appointmentId,

                    {
                        date,
                        timeSlot:
                            appointment
                                .timeSlot
                    },

                    token
                );

                Alert.alert(
                    "Success",
                    "Appointment updated"
                );

                goBack();

            } catch (err) {

                console.log(err);

                Alert.alert(
                    "Error",
                    err?.response?.data?.message ||
                    "Update failed"
                );
            }
        };

    return (

        <SafeAreaView
            style={
                styles.container
            }
        >

            <TouchableOpacity
                onPress={goBack}
            >
                <Text
                    style={
                        styles.back
                    }
                >
                    ← Back
                </Text>
            </TouchableOpacity>

            <Text
                style={
                    styles.title
                }
            >
                Edit Appointment
            </Text>

            <TouchableOpacity
                style={
                    styles.dateButton
                }
                onPress={() =>
                    setShowPicker(
                        true
                    )
                }
            >
                <Text>
                    {
                        date
                            .toDateString()
                    }
                </Text>
            </TouchableOpacity>

            {
                showPicker && (

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

                            setShowPicker(
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

            <TouchableOpacity
                style={
                    styles.button
                }
                onPress={
                    handleUpdate
                }
            >
                <Text
                    style={
                        styles.buttonText
                    }
                >
                    Update Appointment
                </Text>
            </TouchableOpacity>

        </SafeAreaView>
    );
}

const styles =
    StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor:
                "#f3f4f6",
            padding: 20
        },

        back: {
            color: "#2563eb",
            fontSize: 18,
            fontWeight: "600"
        },

        title: {
            fontSize: 28,
            fontWeight: "700",
            marginVertical: 20
        },

        dateButton: {
            backgroundColor:
                "#fff",
            padding: 16,
            borderRadius: 12
        },

        button: {
            backgroundColor:
                "#2563eb",
            padding: 16,
            borderRadius: 12,
            marginTop: 20,
            alignItems: "center"
        },

        buttonText: {
            color: "#fff",
            fontWeight: "700"
        }
    });