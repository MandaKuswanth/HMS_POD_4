import React, { useState, useRef } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
} from "react-native";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import AppInput from "../../components/AppInput";
import SectionLabel from "../../components/SectionLabel";

import ChipSelector from "../../components/forms/ChipSelector";
import DatePickerField from "../../components/forms/DatePickerField";
import AddressForm from "../../components/forms/AddressForm";
import EmergencyContactForm from "../../components/forms/EmergencyContactForm";

import { useAuth } from "../../context/AuthContext";
import COLORS from "../../utils/colors";
import { formatDateForApi } from "../../utils/dateUtils";

import {
    firstErrorMessage,
    isEmpty,
    isValidEmail,
    isValidIndianMobile,
    isValidPassword,
    isValidPincode,
    validateRegisterSubmit,
} from "../../utils/validators";

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [gender, setGender] = useState("");
    const [bloodGroup, setBloodGroup] = useState("");
    const [dob, setDob] = useState(null);

    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [stateName, setStateName] = useState("");
    const [pincode, setPincode] = useState("");

    const [ecName, setEcName] = useState("");
    const [ecRelation, setEcRelation] = useState("");
    const [ecPhone, setEcPhone] = useState("");

    const phoneRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const GENDER_OPTIONS = ["male", "female", "others"];
    const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

    const formatGender = (gender) => gender.charAt(0).toUpperCase() + gender.slice(1);

    const [errors, setErrors] = useState({
        name: "", phone: "", email: "", password: "", gender: "", dob: "", pincode: "", emergencyPhone: "",
    });

    const [loading, setLoading] = useState(false);

    const updateError = (field, message) => {
        setErrors((prev) => ({ ...prev, [field]: message }));
    };

    const handleNameChange = (value) => {
        setName(value);
        if (isEmpty(value)) return updateError("name", "");
        updateError("name", value.trim().length < 3 ? "Name must be at least 3 characters" : "");
    };

    const handlePhoneChange = (value) => {
        setPhone(value);
        if (isEmpty(value)) return updateError("phone", "");
        updateError("phone", isValidIndianMobile(value) ? "" : "Phone must be a valid 10-digit Indian mobile number");
    };

    const handleEmailChange = (value) => {
        setEmail(value);
        if (isEmpty(value)) return updateError("email", "");
        updateError("email", isValidEmail(value) ? "" : "Please enter a valid email address");
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
        if (isEmpty(value)) return updateError("password", "");
        updateError("password", isValidPassword(value) ? "" : "Password must be at least 8 characters");
    };

    const handlePincodeChange = (value) => {
        setPincode(value);
        updateError("pincode", isValidPincode(value) ? "" : "Pincode must be 6 digits");
    };

    const handleEmergencyPhoneChange = (value) => {
        setEcPhone(value);
        if (isEmpty(value)) return updateError("emergencyPhone", "");
        updateError("emergencyPhone", isValidIndianMobile(value) ? "" : "Emergency contact phone must be a valid 10-digit mobile number");
    };

    const handleRegister = async () => {
        const submitErrors = validateRegisterSubmit({
            name, phone, email, password, gender, dob, pincode, emergencyPhone: ecPhone,
        });

        setErrors((prev) => ({ ...prev, ...submitErrors }));

        const message = firstErrorMessage(submitErrors);
        if (message) {
            Alert.alert("Validation Error", message);
            return;
        }

        try {
            setLoading(true);

            await register({
                name: name.trim(),
                phone: phone.trim(),
                email: email.trim().toLowerCase(),
                password,
                gender,
                bloodGroup,
                dob: formatDateForApi(dob),
                address: {
                    street: street.trim(),
                    city: city.trim(),
                    state: stateName.trim(),
                    pincode: pincode.trim(),
                },
                emergencyContact: {
                    name: ecName.trim(),
                    relation: ecRelation.trim(),
                    phone: ecPhone.trim(),
                },
            });

            Alert.alert("Success", "Account created successfully. Please login.");
            navigation.navigate("Login");
        } catch (err) {
            Alert.alert(
                "Registration Failed",
                err?.response?.data?.message || err?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        <AppCard style={styles.card}>
                            <View style={styles.header}>
                                <Text style={styles.logo}>🏥</Text>
                                <Text style={styles.title}>Create Account</Text>
                                <Text style={styles.subtitle}>Register as a patient</Text>
                            </View>

                            <SectionLabel text="Basic Information" />

                            <AppInput
                                placeholder="Full Name *"
                                value={name}
                                onChangeText={handleNameChange}
                                error={errors.name}
                                returnKeyType="next"
                                onSubmitEditing={() => phoneRef.current?.focus()}
                                blurOnSubmit={false}
                            />

                            <AppInput
                                ref={phoneRef}
                                placeholder="Phone Number *"
                                value={phone}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                error={errors.phone}
                                returnKeyType="next"
                                onSubmitEditing={() => emailRef.current?.focus()}
                                blurOnSubmit={false}
                            />

                            <AppInput
                                ref={emailRef}
                                placeholder="Email *"
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                error={errors.email}
                                returnKeyType="next"
                                onSubmitEditing={() => passwordRef.current?.focus()}
                                blurOnSubmit={false}
                            />

                            <AppInput
                                ref={passwordRef}
                                placeholder="Password *"
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry
                                error={errors.password}
                                returnKeyType="done"
                            />

                            <ChipSelector
                                label="Gender"
                                options={GENDER_OPTIONS}
                                value={gender}
                                required
                                error={errors.gender}
                                formatLabel={formatGender}
                                onChange={(value) => {
                                    setGender(value);
                                    updateError("gender", "");
                                }}
                            />

                            <ChipSelector
                                label="Blood Group"
                                options={BLOOD_GROUPS}
                                value={bloodGroup}
                                onChange={setBloodGroup}
                            />

                            <DatePickerField
                                label="Date of Birth"
                                value={dob}
                                required
                                error={errors.dob}
                                onChange={(selectedDate) => {
                                    setDob(selectedDate);
                                    updateError("dob", "");
                                }}
                            />

                            <AddressForm
                                street={street}
                                city={city}
                                stateName={stateName}
                                pincode={pincode}
                                onStreetChange={setStreet}
                                onCityChange={setCity}
                                onStateChange={setStateName}
                                onPincodeChange={handlePincodeChange}
                                pincodeError={errors.pincode}
                            />

                            <EmergencyContactForm
                                name={ecName}
                                relation={ecRelation}
                                phone={ecPhone}
                                onNameChange={setEcName}
                                onRelationChange={setEcRelation}
                                onPhoneChange={handleEmergencyPhoneChange}
                                phoneError={errors.emergencyPhone}
                            />

                            <AppButton
                                title="Create Account"
                                onPress={handleRegister}
                                loading={loading}
                                style={styles.submitBtn}
                            />

                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                    <Text style={styles.loginLink}>Login</Text>
                                </TouchableOpacity>
                            </View>
                        </AppCard>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    card: {
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },
    logo: {
        fontSize: 55,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        textAlign: "center",
        color: COLORS.subtitle,
        fontSize: 15,
    },
    submitBtn: {
        marginTop: 16,
        marginBottom: 24,
    },
    loginContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    loginText: {
        fontSize: 15,
        color: COLORS.subtitle,
    },
    loginLink: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: "bold",
    },
});