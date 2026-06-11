import React, {
    useState
} from "react";

import {
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert
} from "react-native";

import DateTimePicker
    from "@react-native-community/datetimepicker";

import {
    updateAppointment
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

export default function EditAppointmentScreen({

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

    const [loading,
        setLoading] =
        useState(false);

    const handleUpdate =
        async () => {

            try {

                setLoading(true);

                await updateAppointment(

                    appointment.appointmentId,

                    {
                        date,
                        timeSlot:
                            appointment.timeSlot
                    },

                    token
                );

                Alert.alert(
                    "Success",
                    "Appointment updated successfully"
                );

                goBack();

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

            <AppHeader
                title="Edit Appointment"
                subtitle="Update your appointment date"
                onBack={goBack}
            />

            <AppCard>

                <Text style={styles.label}>
                    Appointment Date
                </Text>

                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() =>
                        setShowPicker(true)
                    }
                >

                    <Text style={styles.dateText}>
                        📅 {date.toDateString()}
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

                <AppButton
                    title={
                        loading
                            ? "Updating..."
                            : "Update Appointment"
                    }
                    onPress={
                        handleUpdate
                    }
                    style={styles.button}
                />

            </AppCard>

        </AppContainer>
    );
}

const styles = StyleSheet.create({

    label: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 10
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
        fontSize: 15,
        fontWeight: "600"
    },

    button: {
        marginTop: 25
    }

});