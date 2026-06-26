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

const sendForgotPasswordRequest = async (data) => {
    const response = await api.post(
        "/patient-auth/forgot-password",
        data
    );

    return unwrap(response);
};

export const forgotPasswordApi = sendForgotPasswordRequest;


export const verifyOTPApi = async (data) => {
    const response = await api.post(
        "/patient-auth/verify-otp",
        data
    );

    return unwrap(response);
};

export const resetPasswordApi = async (data) => {
    const response = await api.post(
        "/patient-auth/reset-password",
        data
    );

    return unwrap(response);
};

export const resendOTPApi = sendForgotPasswordRequest;

export const resetTemporaryPasswordApi = async (data) => {
    const response = await api.post(
        "/patient-auth/reset-temporary-password",
        data
    );

    return unwrap(response);
};