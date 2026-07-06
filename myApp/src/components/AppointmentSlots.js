import React from "react";
import PropTypes from "prop-types";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import COLORS from "../utils/colors";

export default function AppointmentSlots({
    loading,
    slots,
    selectedSlot,
    isBookedSlot,
    onSelectSlot,
    showEmpty = false,
    emptyMessage = "No slots available",
}) {
    if (loading) {
        return (
            <ActivityIndicator
                color={COLORS.primary}
                style={styles.loader}
            />
        );
    }

    if (showEmpty) {
        return (
            <View style={styles.slotsEmpty}>
                <Text style={styles.slotsEmptyText}>
                    {emptyMessage}
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.slotsGrid}>
            {slots.map((slot) => {
                const booked = isBookedSlot(slot);
                const selected = selectedSlot === slot;

                return (
                    <TouchableOpacity
                        key={slot}
                        disabled={booked}
                        style={[
                            styles.slotChip,
                            selected && styles.slotChipActive,
                            booked && styles.slotChipDisabled,
                        ]}
                        onPress={() => onSelectSlot(slot, booked)}
                    >
                        <Text
                            style={[
                                styles.slotText,
                                selected && styles.slotTextActive,
                                booked && styles.slotTextDisabled,
                            ]}
                        >
                            {booked ? `${slot} (Booked)` : slot}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

AppointmentSlots.propTypes = {
    loading: PropTypes.bool,
    slots: PropTypes.arrayOf(PropTypes.string),
    selectedSlot: PropTypes.string,
    isBookedSlot: PropTypes.func.isRequired,
    onSelectSlot: PropTypes.func.isRequired,
    showEmpty: PropTypes.bool,
    emptyMessage: PropTypes.string,
};

AppointmentSlots.defaultProps = {
    loading: false,
    slots: [],
    selectedSlot: "",
    showEmpty: false,
    emptyMessage: "No slots available",
};

const styles = StyleSheet.create({
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

    loader: {
        marginVertical: 12,
    },
});