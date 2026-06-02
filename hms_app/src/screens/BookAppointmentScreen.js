import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import Header from "../components/Header";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import CustomDropdown from "../components/CustomDropdown";
import { AppointmentContext } from "../context/AppointmentContext";

const departments = [
  { label: "General Medicine", value: "General Medicine" },
  { label: "Cardiology", value: "Cardiology" },
  { label: "Orthopedics", value: "Orthopedics" },
  { label: "Neurology", value: "Neurology" },
  { label: "Dermatology", value: "Dermatology" },
  { label: "Pediatrics", value: "Pediatrics" },
];

const formatDate = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const BookAppointmentScreen = ({ navigation }) => {
  const {
    bookAppointment,
    getDoctors,
    getAvailableSlots,
    doctors,
    timeSlots,
    loading,
    doctorLoading,
    slotLoading,
  } = useContext(AppointmentContext);

  const [department, setDepartment] = useState("");
  const [doctorEmployeeId, setDoctorEmployeeId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (doctorEmployeeId && date) {
      getAvailableSlots(doctorEmployeeId, date);
    }
  }, [doctorEmployeeId, date, getAvailableSlots]);

  const doctorOptions = doctors.map((doctor) => ({
    label: `${doctor.name} - ${doctor.employeeCode}`,
    value: doctor.employeeCode,
  }));

  const slotOptions = timeSlots.map((slot) => ({
    label: slot,
    value: slot,
  }));

  const handleDepartmentSelect = async (item) => {
    setDepartment(item.value);
    setDoctorEmployeeId("");
    setDoctorName("");
    setDate("");
    setTimeSlot("");

    setErrors({
      ...errors,
      department: null,
      doctorEmployeeId: null,
      date: null,
      timeSlot: null,
    });

    await getDoctors(item.value);
  };

  const handleBook = async () => {
    const newErrors = {};

    if (!department) newErrors.department = "Department is required";
    if (!doctorEmployeeId) newErrors.doctorEmployeeId = "Doctor is required";
    if (!date) newErrors.date = "Date is required";
    if (!timeSlot) newErrors.timeSlot = "Time slot is required";
    if (!reason.trim()) newErrors.reason = "Reason is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      department,
      doctorEmployeeId,
      date,
      timeSlot,
      reason: reason.trim(),
    };

    console.log("Sending Appointment Payload:", payload);

    const res = await bookAppointment(payload);

    if (res.success) {
      Alert.alert(
        "Success",
        "Appointment booked successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("MyAppointmentsScreen"),
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Book Appointment" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formCard}>
          <Text style={styles.infoText}>
            Select department, doctor, date and available time slot.
          </Text>

          <CustomDropdown
            label="Department *"
            placeholder="Select Department"
            value={department}
            options={departments}
            error={errors.department}
            onSelect={handleDepartmentSelect}
          />

          <CustomDropdown
            label="Doctor *"
            placeholder={
              !department
                ? "Select department first"
                : doctorLoading
                  ? "Loading doctors..."
                  : doctorOptions.length === 0
                    ? "No doctors found"
                    : "Select Doctor"
            }
            value={doctorName}
            options={doctorOptions}
            error={errors.doctorEmployeeId}
            onSelect={(item) => {
              setDoctorEmployeeId(item.value);
              setDoctorName(item.label);
              setDate("");
              setTimeSlot("");
              setErrors({ ...errors, doctorEmployeeId: null });
            }}
          />

          <Text style={styles.label}>Date *</Text>

          {Platform.OS === "web" ? (
            <input
              type="date"
              value={date}
              min={formatDate(new Date())}
              onChange={(e) => {
                setDate(e.target.value);
                setTimeSlot("");
                setErrors({ ...errors, date: null });
              }}
              style={{
                height: 52,
                border: errors.date
                  ? "1px solid #DC2626"
                  : "1px solid #D1D5DB",
                borderRadius: 10,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 16,
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.dateInput, errors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[styles.dateText, !date && styles.placeholderText]}
                >
                  {date || "Select Date"}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date ? new Date(date) : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);

                    if (selectedDate) {
                      setDate(formatDate(selectedDate));
                      setTimeSlot("");
                      setErrors({ ...errors, date: null });
                    }
                  }}
                />
              )}
            </>
          )}

          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}

          <CustomDropdown
            label="Time Slot *"
            placeholder={
              slotLoading
                ? "Loading slots..."
                : doctorEmployeeId && date && slotOptions.length === 0
                  ? "No slots available"
                  : doctorEmployeeId && date
                    ? "Select Available Time Slot"
                    : "Select doctor and date first"
            }
            value={timeSlot}
            options={slotOptions}
            error={errors.timeSlot}
            onSelect={(item) => {
              setTimeSlot(item.value);
              setErrors({ ...errors, timeSlot: null });
            }}
          />

          <CustomInput
            label="Reason for Visit *"
            placeholder="Briefly describe your symptoms/reason"
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              setErrors({ ...errors, reason: null });
            }}
            error={errors.reason}
            multiline
          />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Selected Details</Text>

            <Text style={styles.summaryText}>
              Department: {department || "-"}
            </Text>

            <Text style={styles.summaryText}>
              Doctor: {doctorName || "-"}
            </Text>

            <Text style={styles.summaryText}>
              Date: {date || "-"}
            </Text>

            <Text style={styles.summaryText}>
              Time Slot: {timeSlot || "-"}
            </Text>

            <Text style={styles.summaryText}>
              Reason: {reason.trim() || "-"}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Book Appointment"
              onPress={handleBook}
              loading={loading}
              disabled={loading || doctorLoading || slotLoading}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FBFF",
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    fontStyle: "italic",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },
  dateInput: {
    height: 54,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    marginBottom: 14,
  },
  dateText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    marginTop: -8,
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: "#EFF6FF",
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1976D2",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: "#374151",
    marginTop: 3,
  },
  buttonContainer: {
    marginTop: 16,
  },
});

export default BookAppointmentScreen;