import React, { useState } from "react";

import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import AppInput from "../../components/AppInput";
import ScreenHeader from "../../components/ScreenHeader";
import SectionLabel from "../../components/SectionLabel";

import { useAuth } from "../../context/AuthContext";

import COLORS from "../../utils/colors";
import { formatDateForApi } from "../../utils/dateUtils";

import {
    firstErrorMessage,
    isEmpty,
    isFutureDate,
    isValidIndianMobile,
    isValidPincode,
    validateEditProfileSubmit,
} from "../../utils/validators";

const BLOOD_GROUPS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
];

export default function EditProfileScreen({
    navigation,
}) {
    const { patient, updateProfile } = useAuth();

    const address =
        typeof patient?.address === "object" &&
            patient.address !== null
            ? patient.address
            : {
                street: patient?.address || "",
                city: "",
                state: "",
                pincode: "",
            };

    const [name, setName] =
        useState(patient?.name || "");

    const [phone, setPhone] =
        useState(patient?.phone || "");

    const [gender, setGender] =
        useState(patient?.gender || "");

    const [bloodGroup, setBloodGroup] =
        useState(patient?.bloodGroup || "");

    const [dob, setDob] =
        useState(
            patient?.dob
                ? new Date(patient.dob)
                : null
        );

    const [showDobPicker, setShowDobPicker] =
        useState(false);

    const [street, setStreet] =
        useState(address.street || "");

    const [city, setCity] =
        useState(address.city || "");

    const [stateName, setStateName] =
        useState(address.state || "");

    const [pincode, setPincode] =
        useState(address.pincode || "");

    const [ecName, setEcName] =
        useState(
            patient?.emergencyContact?.name || ""
        );

    const [ecRelation, setEcRelation] =
        useState(
            patient?.emergencyContact?.relation || ""
        );

    const [ecPhone, setEcPhone] =
        useState(
            patient?.emergencyContact?.phone || ""
        );

    const [errors, setErrors] =
        useState({
            name: "",
            phone: "",
            gender: "",
            dob: "",
            pincode: "",
            emergencyPhone: "",
        });

    const [loading, setLoading] =
        useState(false);

    const updateError = (field, message) => {
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };

    const handleNameChange = (value) => {
        setName(value);

        if (isEmpty(value)) {
            updateError("name", "");
            return;
        }

        updateError(
            "name",
            value.trim().length < 3
                ? "Name must be at least 3 characters"
                : ""
        );
    };

    const handlePhoneChange = (value) => {
        setPhone(value);

        if (isEmpty(value)) {
            updateError("phone", "");
            return;
        }

        updateError(
            "phone",
            isValidIndianMobile(value)
                ? ""
                : "Phone must be a valid 10-digit Indian mobile number"
        );
    };

    const handlePincodeChange = (value) => {
        setPincode(value);

        updateError(
            "pincode",
            isValidPincode(value)
                ? ""
                : "Pincode must be 6 digits"
        );
    };

    const handleEmergencyPhoneChange = (value) => {
        setEcPhone(value);

        if (isEmpty(value)) {
            updateError("emergencyPhone", "");
            return;
        }

        updateError(
            "emergencyPhone",
            isValidIndianMobile(value)
                ? ""
                : "Emergency contact phone must be a valid 10-digit mobile number"
        );
    };

    const handleUpdate = async () => {
        const submitErrors =
            validateEditProfileSubmit({
                name,
                phone,
                gender,
                dob,
                pincode,
                emergencyPhone: ecPhone,
            });

        setErrors((prev) => ({
            ...prev,
            ...submitErrors,
        }));

        const message =
            firstErrorMessage(submitErrors);

        if (message) {
            Alert.alert(
                "Validation Error",
                message
            );
            return;
        }

        try {
            setLoading(true);

            await updateProfile({
                name: name.trim(),
                phone: phone.trim(),
                gender,
                bloodGroup,
                dob: dob
                    ? formatDateForApi(dob)
                    : undefined,
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

            Alert.alert(
                "Success",
                "Profile updated successfully"
            );

            navigation.goBack();
        } catch (err) {
            Alert.alert(
                "Error",
                err?.response?.data?.message ||
                err?.message ||
                "Update failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scroll}
            >
                <ScreenHeader
                    title="Edit Profile"
                    subtitle="Update your personal information"
                    goBack={() => navigation.goBack()}
                />

                <AppCard style={styles.card}>
                    <SectionLabel text="Basic Information" />

                    <AppInput
                        placeholder="Full Name"
                        value={name}
                        onChangeText={handleNameChange}
                        error={errors.name}
                    />

                    <AppInput
                        placeholder="Phone Number"
                        value={phone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        error={errors.phone}
                    />

                    <Text style={styles.label}>
                        Gender
                    </Text>

                    <View style={styles.chipRow}>
                        {["male", "female", "others"].map(
                            (g) => (
                                <TouchableOpacity
                                    key={g}
                                    style={[
                                        styles.chip,
                                        gender === g &&
                                        styles.chipActive,
                                    ]}
                                    onPress={() => {
                                        setGender(g);
                                        updateError(
                                            "gender",
                                            ""
                                        );
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            gender === g &&
                                            styles.chipTextActive,
                                        ]}
                                    >
                                        {g
                                            .charAt(0)
                                            .toUpperCase() +
                                            g.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            )
                        )}
                    </View>

                    {errors.gender ? (
                        <Text style={styles.inlineError}>
                            {errors.gender}
                        </Text>
                    ) : null}

                    <Text style={styles.label}>
                        Blood Group
                    </Text>

                    <View style={styles.chipRow}>
                        {BLOOD_GROUPS.map((bg) => (
                            <TouchableOpacity
                                key={bg}
                                style={[
                                    styles.chip,
                                    bloodGroup === bg &&
                                    styles.chipActive,
                                ]}
                                onPress={() =>
                                    setBloodGroup(bg)
                                }
                            >
                                <Text
                                    style={[
                                        styles.chipText,
                                        bloodGroup === bg &&
                                        styles.chipTextActive,
                                    ]}
                                >
                                    {bg}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>
                        Date of Birth
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.dateBtn,
                            errors.dob &&
                            styles.dateBtnError,
                        ]}
                        onPress={() =>
                            setShowDobPicker(true)
                        }
                    >
                        <Text
                            style={[
                                styles.dateBtnText,
                                !dob && {
                                    color: COLORS.subtitle,
                                },
                            ]}
                        >
                            {dob
                                ? formatDateForApi(dob)
                                : "Select date of birth"}
                        </Text>
                    </TouchableOpacity>

                    {errors.dob ? (
                        <Text style={styles.inlineError}>
                            {errors.dob}
                        </Text>
                    ) : null}

                    {showDobPicker && (
                        <DateTimePicker
                            value={
                                dob ||
                                new Date(2000, 0, 1)
                            }
                            mode="date"
                            maximumDate={new Date()}
                            onChange={(
                                event,
                                selectedDate
                            ) => {
                                if (
                                    Platform.OS ===
                                    "android"
                                ) {
                                    setShowDobPicker(false);
                                }

                                if (selectedDate) {
                                    setDob(selectedDate);

                                    updateError(
                                        "dob",
                                        isFutureDate(
                                            selectedDate
                                        )
                                            ? "Date of birth cannot be a future date"
                                            : ""
                                    );
                                }

                                if (
                                    Platform.OS === "ios"
                                ) {
                                    setShowDobPicker(false);
                                }
                            }}
                        />
                    )}
                </AppCard>

                <AppCard style={styles.card}>
                    <SectionLabel text="Address" />

                    <AppInput
                        placeholder="Street Address"
                        value={street}
                        onChangeText={setStreet}
                    />

                    <AppInput
                        placeholder="City"
                        value={city}
                        onChangeText={setCity}
                    />

                    <AppInput
                        placeholder="State"
                        value={stateName}
                        onChangeText={setStateName}
                    />

                    <AppInput
                        placeholder="Pincode"
                        value={pincode}
                        onChangeText={handlePincodeChange}
                        keyboardType="numeric"
                        error={errors.pincode}
                    />
                </AppCard>

                <AppCard style={styles.card}>
                    <SectionLabel text="Emergency Contact" />

                    <AppInput
                        placeholder="Contact Name"
                        value={ecName}
                        onChangeText={setEcName}
                    />

                    <AppInput
                        placeholder="Relation"
                        value={ecRelation}
                        onChangeText={setEcRelation}
                    />

                    <AppInput
                        placeholder="Contact Phone"
                        value={ecPhone}
                        onChangeText={
                            handleEmergencyPhoneChange
                        }
                        keyboardType="phone-pad"
                        error={errors.emergencyPhone}
                    />
                </AppCard>

                <View style={styles.buttonContainer}>
                    <AppButton
                        title="Update Profile"
                        onPress={handleUpdate}
                        loading={loading}
                        disabled={loading}
                    />
                </View>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
    },

    card: {
        marginHorizontal: 20,
        marginBottom: 14,
    },

    label: {
        fontSize: 15,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 10,
    },

    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },

    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },

    chipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },

    chipText: {
        fontSize: 14,
        fontWeight: "800",
        color: COLORS.text,
    },

    chipTextActive: {
        color: "#fff",
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

    buttonContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
});