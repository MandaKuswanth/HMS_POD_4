import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MedicalRecordCard({
  doctorName,
  specialization,
    diagnosis,
  symptoms,
  prescription,
  appointmentDate,
}) {
  console.log("APPOINTMENT DATE =", appointmentDate);
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.doctorName}> Dr {doctorName}</Text>
          <Text style={styles.specialization}>{specialization}</Text>
          <Text style={styles.date}>
  {appointmentDate
    ? new Date(appointmentDate).toLocaleDateString()
    : ""}
</Text>
        </View>

        {appointmentDate && (
          <Text style={styles.date}>{appointmentDate}</Text>
        )}
      </View>

     <View style={styles.diagnosisBox}>
    <Text style={styles.sectionTitle}>
        Diagnosis
    </Text>

    <Text style={styles.diagnosisText}>
        {diagnosis || "N/A"}
    </Text>
</View>

<View style={styles.infoSection}>
    <Text style={styles.label}>
        Symptoms
    </Text>

    <Text style={styles.value}>
        {symptoms || "N/A"}
    </Text>
</View>

<View style={styles.infoSection}>
    <Text style={styles.label}>
        Prescription
    </Text>

    <Text style={styles.value}>
        {prescription || "N/A"}
    </Text>
</View>


     

     

   
    </View>
  );
}

const styles = StyleSheet.create({
card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 18,
    padding: 18,

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,

    shadowOffset: {
        width: 0,
        height: 4,
    },
},
header: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
},

  doctorName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },

  specialization: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
  },

  date: {
    fontSize: 12,
    color: "#94A3B8",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 15,
  },

  section: {
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  value: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
  },
  diagnosisBox: {
    backgroundColor: "#EEF6FF",
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
},

sectionTitle: {
    fontSize: 13,
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 6,
},

diagnosisText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
},

infoSection: {
    marginBottom: 18,
},

dateFooter: {
    marginTop: 10,
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "right",
},
});