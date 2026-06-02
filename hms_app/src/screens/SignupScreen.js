import React, { useState, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";

import {
    validateEmail,
    validateRequired,
    validatePhone,
} from "../utils/validation";

const DropdownField = ({ label, value, onValueChange, items, error }) => {
    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>

            <View style={[styles.dropdownBox, error && styles.errorBorder]}>
                <Picker
                    selectedValue={value}
                    onValueChange={onValueChange}
                    style={styles.picker}
                >
                    <Picker.Item label="Select" value="" />
                    {items.map((item) => (
                        <Picker.Item
                            key={item.value}
                            label={item.label}
                            value={item.value}
                        />
                    ))}
                </Picker>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
};

const SignupScreen = ({ navigation }) => {
    const { register, loading } = useContext(AuthContext);

    const [showDatePicker, setShowDatePicker] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        gender: "",
        dob: "",
        address: "",
        emergencyContactName: "",
        emergencyContactRelation: "",
        emergencyContactPhone: "",
        bloodGroup: "",
        allergies: "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [field]: null,
        }));
    };

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);

        if (selectedDate) {
            handleChange("dob", formatDate(selectedDate));
        }
    };

    const validateForm = () => {
        let newErrors = {};

        if (!validateRequired(formData.name)) {
            newErrors.name = "Full Name is required";
        }

        if (!validateRequired(formData.email)) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!validateRequired(formData.password)) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!validateRequired(formData.confirmPassword)) {
            newErrors.confirmPassword = "Confirm Password is required";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        if (!validateRequired(formData.phone)) {
            newErrors.phone = "Phone Number is required";
        } else if (!validatePhone(formData.phone)) {
            newErrors.phone = "Invalid phone number";
        }

        if (!validateRequired(formData.gender)) {
            newErrors.gender = "Gender is required";
        }

        if (!validateRequired(formData.dob)) {
            newErrors.dob = "Date of birth is required";
        }

        if (!validateRequired(formData.address)) {
            newErrors.address = "Address is required";
        }

        if (
            formData.emergencyContactPhone &&
            !validatePhone(formData.emergencyContactPhone)
        ) {
            newErrors.emergencyContactPhone =
                "Invalid emergency contact phone number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        const isValid = validateForm();

        if (!isValid) {
            Alert.alert("Validation Error", "Please check the highlighted fields.");
            return;
        }

        const payload = {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            phone: formData.phone.trim(),
            gender: formData.gender.trim().toLowerCase(),
            dob: formData.dob.trim(),
            address: formData.address.trim(),
            emergencyContactName: formData.emergencyContactName.trim(),
            emergencyContactRelation: formData.emergencyContactRelation.trim(),
            emergencyContactPhone: formData.emergencyContactPhone.trim(),
            bloodGroup: formData.bloodGroup.trim(),
            allergies: formData.allergies.trim(),
        };

        try {
            const res = await register(payload);

            if (res?.success) {
                Alert.alert("Success", "Registration successful. Please login.", [
                    {
                        text: "OK",
                        onPress: () => navigation.navigate("LoginScreen"),
                    },
                ]);
            } else {
                Alert.alert(
                    "Registration Failed",
                    res?.message || "Something went wrong. Please try again."
                );
            }
        } catch (error) {
            Alert.alert(
                "Error",
                error?.message || "Unable to register. Please try again later."
            );
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Patient Registration" />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.formContainer}>
                        <Text style={styles.mainTitle}>Create Patient Account</Text>
                        <Text style={styles.subTitle}>
                            Fill your details to register as a patient
                        </Text>

                        <Text style={styles.sectionTitle}>Account Details</Text>

                        <CustomInput
                            label="Full Name *"
                            placeholder="Enter full name"
                            value={formData.name}
                            onChangeText={(text) => handleChange("name", text)}
                            error={errors.name}
                        />

                        <CustomInput
                            label="Email *"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChangeText={(text) => handleChange("email", text)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />

                        <CustomInput
                            label="Password *"
                            placeholder="Create a password"
                            value={formData.password}
                            onChangeText={(text) => handleChange("password", text)}
                            secureTextEntry
                            error={errors.password}
                        />

                        <CustomInput
                            label="Confirm Password *"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChangeText={(text) =>
                                handleChange("confirmPassword", text)
                            }
                            secureTextEntry
                            error={errors.confirmPassword}
                        />

                        <Text style={styles.sectionTitle}>Personal Details</Text>

                        <CustomInput
                            label="Phone Number *"
                            placeholder="10-digit phone number"
                            value={formData.phone}
                            onChangeText={(text) => handleChange("phone", text)}
                            keyboardType="phone-pad"
                            maxLength={10}
                            error={errors.phone}
                        />

                        <DropdownField
                            label="Gender *"
                            value={formData.gender}
                            onValueChange={(value) => handleChange("gender", value)}
                            error={errors.gender}
                            items={[
                                { label: "Male", value: "male" },
                                { label: "Female", value: "female" },
                                { label: "Others", value: "others" },
                            ]}
                        />

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Date of Birth *</Text>

                            <TouchableOpacity
                                style={[
                                    styles.dateBox,
                                    errors.dob && styles.errorBorder,
                                ]}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.dateText,
                                        !formData.dob && styles.placeholderText,
                                    ]}
                                >
                                    {formData.dob || "Select date of birth"}
                                </Text>
                            </TouchableOpacity>

                            {errors.dob ? (
                                <Text style={styles.errorText}>{errors.dob}</Text>
                            ) : null}
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.dob ? new Date(formData.dob) : new Date()}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                maximumDate={new Date()}
                                onChange={handleDateChange}
                            />
                        )}

                        <CustomInput
                            label="Address *"
                            placeholder="Enter full address"
                            value={formData.address}
                            onChangeText={(text) => handleChange("address", text)}
                            multiline
                            error={errors.address}
                        />

                        <Text style={styles.sectionTitle}>Emergency Contact</Text>

                        <CustomInput
                            label="Emergency Contact Name"
                            placeholder="Enter emergency contact name"
                            value={formData.emergencyContactName}
                            onChangeText={(text) =>
                                handleChange("emergencyContactName", text)
                            }
                        />

                        <DropdownField
                            label="Emergency Contact Relation"
                            value={formData.emergencyContactRelation}
                            onValueChange={(value) =>
                                handleChange("emergencyContactRelation", value)
                            }
                            items={[
                                { label: "Father", value: "Father" },
                                { label: "Mother", value: "Mother" },
                                { label: "Brother", value: "Brother" },
                                { label: "Sister", value: "Sister" },
                                { label: "Spouse", value: "Spouse" },
                                { label: "Friend", value: "Friend" },
                                { label: "Other", value: "Other" },
                            ]}
                        />

                        <CustomInput
                            label="Emergency Contact Phone"
                            placeholder="10-digit emergency phone"
                            value={formData.emergencyContactPhone}
                            onChangeText={(text) =>
                                handleChange("emergencyContactPhone", text)
                            }
                            keyboardType="phone-pad"
                            maxLength={10}
                            error={errors.emergencyContactPhone}
                        />

                        <Text style={styles.sectionTitle}>Medical Information</Text>

                        <DropdownField
                            label="Blood Group"
                            value={formData.bloodGroup}
                            onValueChange={(value) =>
                                handleChange("bloodGroup", value)
                            }
                            items={[
                                { label: "A+", value: "A+" },
                                { label: "A-", value: "A-" },
                                { label: "B+", value: "B+" },
                                { label: "B-", value: "B-" },
                                { label: "AB+", value: "AB+" },
                                { label: "AB-", value: "AB-" },
                                { label: "O+", value: "O+" },
                                { label: "O-", value: "O-" },
                            ]}
                        />

                        <CustomInput
                            label="Allergies"
                            placeholder="Example: Dust allergy / No allergies"
                            value={formData.allergies}
                            onChangeText={(text) => handleChange("allergies", text)}
                            multiline
                        />

                        <View style={styles.buttonContainer}>
                            <CustomButton
                                title="Register"
                                OnPress={handleSignup}
                                loading={loading}
                                disabled={loading}
                            />
                        </View>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>
                                Already have an account?{" "}
                            </Text>

                            <Text
                                style={styles.loginLink}
                                onPress={() => navigation.navigate("LoginScreen")}
                            >
                                Login
                            </Text>
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
        padding: 16,
        paddingBottom: 35,
    },

    formContainer: {
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },

    mainTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1F2937",
        textAlign: "center",
        marginBottom: 6,
    },

    subTitle: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 24,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1976D2",
        marginTop: 16,
        marginBottom: 14,
    },

    inputWrapper: {
        marginBottom: 14,
    },

    label: {
        fontSize: 14,
        color: "#374151",
        fontWeight: "600",
        marginBottom: 6,
    },

    dropdownBox: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        overflow: "hidden",
    },

    picker: {
        height: 50,
        color: "#111827",
    },

    dateBox: {
        height: 50,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        justifyContent: "center",
        paddingHorizontal: 14,
    },

    dateText: {
        fontSize: 15,
        color: "#111827",
    },

    placeholderText: {
        color: "#9CA3AF",
    },

    errorBorder: {
        borderColor: "#DC2626",
    },

    errorText: {
        color: "#DC2626",
        fontSize: 12,
        marginTop: 5,
    },

    buttonContainer: {
        marginTop: 22,
    },

    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 18,
    },

    loginText: {
        fontSize: 15,
        color: "#6B7280",
    },

    loginLink: {
        fontSize: 15,
        color: "#1976D2",
        fontWeight: "bold",
    },
});

export default SignupScreen;