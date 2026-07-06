import React from "react";

import AppInput from "../AppInput";
import SectionLabel from "../SectionLabel";
import ChipSelector from "./ChipSelector";
import DatePickerField from "./DatePickerField";

import {
    BLOOD_GROUPS,
    GENDER_OPTIONS,
    formatGender,
} from "./patientFormOptions";

import PropTypes from "prop-types";

export default function PatientPersonalForm({
    name,
    phone,
    email,
    password,
    gender,
    bloodGroup,
    dob,
    errors,
    onNameChange,
    onPhoneChange,
    onEmailChange,
    onPasswordChange,
    onGenderChange,
    onBloodGroupChange,
    onDobChange,
    includeAuthFields = false,
    requiredDob = false,
    requiredPlaceholders = false,
}) {
    const requiredMark = requiredPlaceholders ? " *" : "";

    return (
        <>
            <SectionLabel text="Basic Information" />

            <AppInput
                placeholder={`Full Name${requiredMark}`}
                value={name}
                onChangeText={onNameChange}
                error={errors.name}
            />

            <AppInput
                placeholder={`Phone Number${requiredMark}`}
                value={phone}
                onChangeText={onPhoneChange}
                keyboardType="phone-pad"
                error={errors.phone}
            />

            {includeAuthFields ? (
                <>
                    <AppInput
                        placeholder={`Email${requiredMark}`}
                        value={email}
                        onChangeText={onEmailChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <AppInput
                        placeholder={`Password${requiredMark}`}
                        value={password}
                        onChangeText={onPasswordChange}
                        secureTextEntry
                        error={errors.password}
                    />
                </>
            ) : null}

            <ChipSelector
                label="Gender"
                options={GENDER_OPTIONS}
                value={gender}
                required
                error={errors.gender}
                formatLabel={formatGender}
                onChange={onGenderChange}
            />

            <ChipSelector
                label="Blood Group"
                options={BLOOD_GROUPS}
                value={bloodGroup}
                onChange={onBloodGroupChange}
            />

            <DatePickerField
                label="Date of Birth"
                value={dob}
                required={requiredDob}
                error={errors.dob}
                onChange={onDobChange}
            />
        </>
    );
}

PatientPersonalForm.propTypes = {
    name: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    password: PropTypes.string,
    gender: PropTypes.string,
    bloodGroup: PropTypes.string,
    dob: PropTypes.object,
    errors: PropTypes.object.isRequired,
    onNameChange: PropTypes.func.isRequired,
    onPhoneChange: PropTypes.func.isRequired,
    onEmailChange: PropTypes.func,
    onPasswordChange: PropTypes.func,
    onGenderChange: PropTypes.func.isRequired,
    onBloodGroupChange: PropTypes.func.isRequired,
    onDobChange: PropTypes.func.isRequired,
    includeAuthFields: PropTypes.bool,
    requiredDob: PropTypes.bool,
    requiredPlaceholders: PropTypes.bool,
};
