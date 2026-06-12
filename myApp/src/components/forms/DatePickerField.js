import React, { useState } from "react";

import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import COLORS from "../../utils/colors";
import { formatDateForApi } from "../../utils/dateUtils";

export default function DatePickerField({
    label,
    value,
    onChange,
    error,
    required = false,
    maximumDate = new Date(),
}) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <>
            <Text style={styles.label}>
                {label}{required ? " *" : ""}
            </Text>

            <TouchableOpacity
                style={[
                    styles.dateBtn,
                    error && styles.dateBtnError,
                ]}
                onPress={() => setShowPicker(true)}
            >
                <Text
                    style={[
                        styles.dateBtnText,
                        !value && { color: COLORS.subtitle },
                    ]}
                >
                    {value
                        ? formatDateForApi(value)
                        : `Select ${label.toLowerCase()}`}
                </Text>
            </TouchableOpacity>

            {error ? (
                <Text style={styles.inlineError}>
                    {error}
                </Text>
            ) : null}

            {showPicker && (
                <DateTimePicker
                    value={value || new Date(2000, 0, 1)}
                    mode="date"
                    maximumDate={maximumDate}
                    onChange={(event, selectedDate) => {
                        if (Platform.OS === "android") {
                            setShowPicker(false);
                        }

                        if (selectedDate) {
                            onChange(selectedDate);
                        }

                        if (Platform.OS === "ios") {
                            setShowPicker(false);
                        }
                    }}
                />
            )}
        </>
    );
}

const styles = StyleSheet.create({
    label: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 10,
    },

    dateBtn: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 6,
    },

    dateBtnError: {
        borderColor: COLORS.danger,
    },

    dateBtnText: {
        fontSize: 15,
        color: COLORS.text,
    },

    inlineError: {
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 10,
    },
});