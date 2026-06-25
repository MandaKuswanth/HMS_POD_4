import api from "../utils/api";

export const unwrap = (response) => {
    return response?.data?.data || response?.data || response;
};

export const registerPatient = async (data) => {
    const response = await api.post(
        "/patient-auth/register",
        data
    );

    return unwrap(response);
};

export const loginPatient = async (data) => {
    const response = await api.post(
        "/patient-auth/login",
        data
    );

    return unwrap(response);
};

// ✅ NEW: Forgot Password - Send OTP to Email
export const forgotPasswordApi = async (data) => {
    const response = await api.post(
        "/patient-auth/forgot-password",
        data
    );

    return unwrap(response);
};

// ✅ NEW: Verify OTP
export const verifyOTPApi = async (data) => {
    const response = await api.post(
        "/patient-auth/verify-otp",
        data
    );

    return unwrap(response);
};

// ✅ NEW: Reset Password
export const resetPasswordApi = async (data) => {
    const response = await api.post(
        "/patient-auth/reset-password",
        data
    );

    return unwrap(response);
};

// ✅ NEW: Resend OTP (use same endpoint as forgot-password)
export const resendOTPApi = async (data) => {
    const response = await api.post(
        "/patient-auth/forgot-password",
        data
    );

    return unwrap(response);
};