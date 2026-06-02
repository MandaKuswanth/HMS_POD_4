import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import Header from "../components/Header";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";

import { AuthContext } from "../context/AuthContext";
import { setItem } from "../utils/storage";
import { updatePatientProfile } from "../api/authApi";

const EditProfileScreen = ({ navigation }) => {
  const { user, patientData, setPatientData } = useContext(AuthContext);

  const profile = patientData || user || {};

  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [gender, setGender] = useState(profile?.gender || "");
  const [dob, setDob] = useState(
    profile?.dob ? String(profile.dob).split("T")[0] : ""
  );
  const [address, setAddress] = useState(profile?.address || "");
  const [emergencyContact, setEmergencyContact] = useState(
    profile?.emergencyContact || ""
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const uhid = profile?.UHID || profile?.uhid || profile?.patientId;

  const clearError = (field) => {
    setErrors((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      newErrors.email = "Enter valid email";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      newErrors.phone = "Enter valid 10 digit phone number";
    }

    if (
      emergencyContact.trim() &&
      !/^[6-9]\d{9}$/.test(emergencyContact.trim())
    ) {
      newErrors.emergencyContact = "Enter valid emergency contact number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gender: gender.trim(),
        dob: dob.trim(),
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
      };

      const response = await updatePatientProfile(payload);

      console.log("Update Profile Response:", response);

      const updatedPatient =
        response?.data?.patient ||
        response?.data ||
        response?.patient ||
        {
          ...profile,
          ...payload,
          UHID: uhid,
        };

      await setItem("patientData", updatedPatient);

      if (setPatientData) {
        setPatientData(updatedPatient);
      }

      Alert.alert("Success", "Profile updated successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.log("Update profile error:", error?.response?.data || error);

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Edit Profile" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Patient Details</Text>

            <View style={styles.uhidBox}>
              <Text style={styles.uhidLabel}>UHID</Text>
              <Text style={styles.uhidValue}>{uhid || "Pending"}</Text>
            </View>

            <CustomInput
              label="Name"
              placeholder="Enter name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                clearError("name");
              }}
              error={errors.name}
            />

            <CustomInput
              label="Email"
              placeholder="Enter email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError("email");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <CustomInput
              label="Phone"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                clearError("phone");
              }}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />

            <CustomInput
              label="Gender"
              placeholder="Male / Female / Other"
              value={gender}
              onChangeText={setGender}
            />

            <CustomInput
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={dob}
              onChangeText={setDob}
            />

            <CustomInput
              label="Address"
              placeholder="Enter address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={4}
            />

            <CustomInput
              label="Emergency Contact"
              placeholder="Enter emergency contact"
              value={emergencyContact}
              onChangeText={(text) => {
                setEmergencyContact(text);
                clearError("emergencyContact");
              }}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.emergencyContact}
            />

            <CustomButton
              title="Update Profile"
              OnPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
            />

            <View style={styles.cancelWrapper}>
              <CustomButton
                title="Cancel"
                OnPress={() => navigation.goBack()}
                type="outline"
                disabled={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 20,
  },

  uhidBox: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
  },

  uhidLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },

  uhidValue: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "bold",
    letterSpacing: 1,
  },

  cancelWrapper: {
    marginTop: 12,
  },
});

export default EditProfileScreen;