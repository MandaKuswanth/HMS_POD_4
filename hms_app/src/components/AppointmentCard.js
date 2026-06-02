import React from "react";
import { View, Text, StyleSheet } from "react-native";

const AppointmentCard = ({ appointment }) => {
  const date = appointment?.date
    ? appointment.date.split("T")[0]
    : "-";

  const time = appointment?.timeSlot || "-";
  const reason = appointment?.reason || "-";
  const status = appointment?.status || "BOOKED";
  const doctorName = appointment?.doctorName || "Doctor";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.appointmentId}>
          {appointment?.appointmentId || "Appointment"}
        </Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <Text style={styles.text}>
        <Text style={styles.label}>Date & Time: </Text>
        {date} at {time}
      </Text>

      <Text style={styles.text}>
        <Text style={styles.label}>Doctor: </Text>
        {doctorName}
      </Text>

      <Text style={styles.text}>
        <Text style={styles.label}>Reason: </Text>
        {reason}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#1976D2",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appointmentId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  text: {
    fontSize: 15,
    color: "#4B5563",
    marginTop: 10,
  },
  label: {
    fontWeight: "700",
    color: "#374151",
  },
});

export default AppointmentCard;