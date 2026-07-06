import { useState } from "react";

import { formatDateForApi } from "../utils/dateUtils";
import { createErrorUpdater } from "../utils/formErrors";
import {
    isEmpty,
    isValidEmail,
    isValidIndianMobile,
    isValidPassword,
    isValidPincode,
} from "../utils/validators";

const EMPTY_INITIAL_VALUES = {
    name: "",
    phone: "",
    email: "",
    password: "",
    gender: "",
    bloodGroup: "",
    dob: null,
    street: "",
    city: "",
    stateName: "",
    pincode: "",
    ecName: "",
    ecRelation: "",
    ecPhone: "",
};

export const getPatientFormInitialValues = (patient) => {
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

    return {
        name: patient?.name || "",
        phone: patient?.phone || "",
        gender: patient?.gender || "",
        bloodGroup: patient?.bloodGroup || "",
        dob: patient?.dob ? new Date(patient.dob) : null,
        street: address.street || "",
        city: address.city || "",
        stateName: address.state || "",
        pincode: address.pincode || "",
        ecName: patient?.emergencyContact?.name || "",
        ecRelation: patient?.emergencyContact?.relation || "",
        ecPhone: patient?.emergencyContact?.phone || "",
    };
};

export default function usePatientProfileForm({
    initialValues = EMPTY_INITIAL_VALUES,
    initialErrors = {},
} = {}) {
    const values = {
        ...EMPTY_INITIAL_VALUES,
        ...initialValues,
    };

    const [name, setName] = useState(values.name);
    const [phone, setPhone] = useState(values.phone);
    const [email, setEmail] = useState(values.email);
    const [password, setPassword] = useState(values.password);
    const [gender, setGender] = useState(values.gender);
    const [bloodGroup, setBloodGroup] = useState(values.bloodGroup);
    const [dob, setDob] = useState(values.dob);
    const [street, setStreet] = useState(values.street);
    const [city, setCity] = useState(values.city);
    const [stateName, setStateName] = useState(values.stateName);
    const [pincode, setPincode] = useState(values.pincode);
    const [ecName, setEcName] = useState(values.ecName);
    const [ecRelation, setEcRelation] = useState(values.ecRelation);
    const [ecPhone, setEcPhone] = useState(values.ecPhone);

    const [errors, setErrors] = useState({
        name: "",
        phone: "",
        email: "",
        password: "",
        gender: "",
        dob: "",
        pincode: "",
        emergencyPhone: "",
        ...initialErrors,
    });

    const updateError = createErrorUpdater(setErrors);

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

    const handleEmailChange = (value) => {
        setEmail(value);

        if (isEmpty(value)) {
            updateError("email", "");
            return;
        }

        updateError(
            "email",
            isValidEmail(value)
                ? ""
                : "Please enter a valid email address"
        );
    };

    const handlePasswordChange = (value) => {
        setPassword(value);

        if (isEmpty(value)) {
            updateError("password", "");
            return;
        }

        updateError(
            "password",
            isValidPassword(value)
                ? ""
                : "Password must be at least 8 characters"
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

    const handleGenderChange = (value) => {
        setGender(value);
        updateError("gender", "");
    };

    const handleDobChange = (selectedDate) => {
        setDob(selectedDate);
        updateError("dob", "");
    };

    const getSubmitValues = () => ({
        name,
        phone,
        email,
        password,
        gender,
        dob,
        pincode,
        emergencyPhone: ecPhone,
    });

    const getPatientPayload = ({
        includeAuthFields = false,
        optionalDob = false,
    } = {}) => ({
        ...(includeAuthFields
            ? {
                email: email.trim().toLowerCase(),
                password,
            }
            : {}),
        name: name.trim(),
        phone: phone.trim(),
        gender,
        bloodGroup,
        dob: optionalDob
            ? dob
                ? formatDateForApi(dob)
                : undefined
            : formatDateForApi(dob),
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

    return {
        name,
        phone,
        email,
        password,
        gender,
        bloodGroup,
        dob,
        street,
        city,
        stateName,
        pincode,
        ecName,
        ecRelation,
        ecPhone,
        errors,
        setErrors,
        handleNameChange,
        handlePhoneChange,
        handleEmailChange,
        handlePasswordChange,
        handleGenderChange,
        handleDobChange,
        handlePincodeChange,
        handleEmergencyPhoneChange,
        setBloodGroup,
        setStreet,
        setCity,
        setStateName,
        setEcName,
        setEcRelation,
        getSubmitValues,
        getPatientPayload,
    };
}
