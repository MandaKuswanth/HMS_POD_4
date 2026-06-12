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