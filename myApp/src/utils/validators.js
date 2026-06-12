import {
    getTomorrowDate,
    normalizeDateOnly,
} from "./dateUtils";

export const isEmpty = (value) => {
    return !value || String(value).trim().length === 0;
};

export const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        String(email).trim()
    );
};

export const isValidIndianMobile = (phone) => {
    const value = String(phone).trim();

    // Only 10 digits, starts with 6/7/8/9
    if (!/^[6-9]\d{9}$/.test(value)) {
        return false;
    }

    // Reject all same numbers like 9999999999, 8888888888
    if (/^(\d)\1{9}$/.test(value)) {
        return false;
    }

    return true;
};

export const isValidPassword = (password) => {
    return String(password).length >= 8;
};

export const isValidPincode = (pincode) => {
    return (
        isEmpty(pincode) ||
        /^\d{6}$/.test(String(pincode).trim())
    );
};

export const isFutureDate = (date) => {
    if (!date) return false;

    return (
        normalizeDateOnly(date) >
        normalizeDateOnly(new Date())
    );
};

export const isTomorrowOrFuture = (date) => {
    if (!date) return false;

    return normalizeDateOnly(date) >= getTomorrowDate();
};

export const firstErrorMessage = (errors) => {
    return Object.values(errors).find(Boolean) || "";
};

export const validateLoginSubmit = ({
    email,
    password,
}) => {
    const errors = {};

    if (isEmpty(email)) {
        errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
        errors.email = "Please enter a valid email address";
    }

    if (isEmpty(password)) {
        errors.password = "Password is required";
    }

    return errors;
};

export const validateRegisterSubmit = ({
    name,
    phone,
    email,
    password,
    gender,
    dob,
    pincode,
    emergencyPhone,
}) => {
    const errors = {};

    if (isEmpty(name)) {
        errors.name = "Full name is required";
    } else if (name.trim().length < 3) {
        errors.name = "Name must be at least 3 characters";
    }

    if (isEmpty(phone)) {
        errors.phone = "Phone number is required";
    } else if (!isValidIndianMobile(phone)) {
        errors.phone = "Phone must be a valid 10-digit Indian mobile number, start with 6-9, and cannot contain all same digits";
    }

    if (isEmpty(email)) {
        errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
        errors.email = "Please enter a valid email address";
    }

    if (isEmpty(password)) {
        errors.password = "Password is required";
    } else if (!isValidPassword(password)) {
        errors.password = "Password must be at least 8 characters";
    }

    if (isEmpty(gender)) {
        errors.gender = "Gender is required";
    }

    if (!dob) {
        errors.dob = "Date of birth is required";
    } else if (isFutureDate(dob)) {
        errors.dob = "Date of birth cannot be a future date";
    }

    if (!isValidPincode(pincode)) {
        errors.pincode = "Pincode must be 6 digits";
    }

    if (
        !isEmpty(emergencyPhone) &&
        !isValidIndianMobile(emergencyPhone)
    ) {
        errors.emergencyPhone = "Emergency contact phone must be a valid 10-digit mobile number, start with 6-9, and cannot contain all same digits";
    }

    return errors;
};

export const validateEditProfileSubmit = ({
    name,
    phone,
    gender,
    dob,
    pincode,
    emergencyPhone,
}) => {
    const errors = {};

    if (isEmpty(name)) {
        errors.name = "Full name is required";
    } else if (name.trim().length < 3) {
        errors.name = "Name must be at least 3 characters";
    }

    if (isEmpty(phone)) {
        errors.phone = "Phone number is required";
    } else if (!isValidIndianMobile(phone)) {
        errors.phone = "Phone must be a valid 10-digit Indian mobile number";
    }

    if (isEmpty(gender)) {
        errors.gender = "Gender is required";
    }

    if (dob && isFutureDate(dob)) {
        errors.dob = "Date of birth cannot be a future date";
    }

    if (!isValidPincode(pincode)) {
        errors.pincode = "Pincode must be 6 digits";
    }

    if (
        !isEmpty(emergencyPhone) &&
        !isValidIndianMobile(emergencyPhone)
    ) {
        errors.emergencyPhone =
            "Emergency contact phone must be a valid 10-digit mobile number";
    }

    return errors;
};