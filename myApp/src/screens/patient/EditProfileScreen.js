import React, { useState } from "react";

import {
    Alert,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

import AppButton from "../../components/AppButton";
import AppCard from "../../components/AppCard";
import AppContainer from "../../components/AppContainer";
import AppInput from "../../components/AppInput";
import ScreenHeader from "../../components/ScreenHeader";
import SectionLabel from "../../components/SectionLabel";
import ChipSelector from "../../components/forms/ChipSelector";
import DatePickerField from "../../components/forms/DatePickerField";
import AddressForm from "../../components/forms/AddressForm";
import EmergencyContactForm from "../../components/forms/EmergencyContactForm";

import { useAuth } from "../../context/AuthContext";

import {
    firstErrorMessage,
    isEmpty,
    isValidIndianMobile,
    isValidPincode,
    validateEditProfileSubmit,
} from "../../utils/validators";

import { formatDateForApi } from "../../utils/dateUtils";
import PropTypes from "prop-types";

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

    const [name, setName] = useState(patient?.name || "");
    const [phone, setPhone] = useState(patient?.phone || "");
    const [gender, setGender] = useState(patient?.gender || "");
    const [bloodGroup, setBloodGroup] = useState(
        patient?.bloodGroup || ""
    );

    const [dob, setDob] = useState(
        patient?.dob ? new Date(patient.dob) : null
    );

    const [street, setStreet] = useState(address.street || "");
    const [city, setCity] = useState(address.city || "");
    const [stateName, setStateName] = useState(address.state || "");
    const [pincode, setPincode] = useState(address.pincode || "");

    const [ecName, setEcName] = useState(
        patient?.emergencyContact?.name || ""
    );

    const [ecRelation, setEcRelation] = useState(
        patient?.emergencyContact?.relation || ""
    );

    const [ecPhone, setEcPhone] = useState(
        patient?.emergencyContact?.phone || ""
    );

    const [errors, setErrors] = useState({
        name: "",
        phone: "",
        gender: "",
        dob: "",
        pincode: "",
        emergencyPhone: "",
    });

    const [loading, setLoading] = useState(false);

    const updateError = (field, message) => {
        setErrors((prev) => ({
            ...prev,
            [field]: message,
        }));
    };
    const GENDER_OPTIONS = [
        "male",
        "female",
        "others",
    ];

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

    const formatGender = (gender) => {
        return gender.charAt(0).toUpperCase() + gender.slice(1);
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
        const submitErrors = validateEditProfileSubmit({
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

        const message = firstErrorMessage(submitErrors);

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
                        error={errors.dob}
                        onChange={(selectedDate) => {
                            setDob(selectedDate);
                            updateError("dob", "");
                        }}
                    />
                </AppCard>

                <AppCard style={styles.card}>
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
                </AppCard>

                <AppCard style={styles.card}>
                    <EmergencyContactForm
                        name={ecName}
                        relation={ecRelation}
                        phone={ecPhone}
                        onNameChange={setEcName}
                        onRelationChange={setEcRelation}
                        onPhoneChange={handleEmergencyPhoneChange}
                        phoneError={errors.emergencyPhone}
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

    buttonContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
});

EditProfileScreen.propTypes = {
    navigation: PropTypes.object.isRequired,
};
