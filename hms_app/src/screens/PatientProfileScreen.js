import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "N/A"}</Text>
  </View>
);

const PatientProfileScreen = ({ navigation }) => {
  const { user, patientData } = useContext(AuthContext);

  const profile = patientData || user || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Patient Profile</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.name || "P").charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>{profile?.name || "Patient"}</Text>
          <Text style={styles.uhid}>
            {profile?.UHID || profile?.patientId || "Pending"}
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <DetailRow label="Name" value={profile?.name} />
          <DetailRow label="UHID" value={profile?.UHID || profile?.patientId} />
          <DetailRow label="Email" value={profile?.email} />
          <DetailRow label="Phone" value={profile?.phone} />
          <DetailRow label="Gender" value={profile?.gender} />
          <DetailRow label="Date of Birth" value={profile?.dob} />
          <DetailRow label="Address" value={profile?.address} />
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("EditProfileScreen")}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default PatientProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  header: {
    height: 60,
    backgroundColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  backButton: {
    width: 40,
    padding: 8,
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  placeholder: {
    width: 40,
  },

  scrollContent: {
    padding: 20,
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "bold",
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },

  uhid: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  label: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  value: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },

  editButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});