import axiosInstance from "./axiosConfig";

// Patient Register
export const registerPatient = async (patientData) => {
    const response = await axiosInstance.post(
        "/patient/auth/register",
        patientData
    );
    return response.data;
};

// Patient Login
export const loginPatient = async (credentials) => {
    const response = await axiosInstance.post(
        "/patient/auth/login",
        credentials
    );
    return response.data;
};

// Get logged-in patient profile
export const getPatientProfile = async () => {
    const response = await axiosInstance.get("/patients/profile/me");
    return response.data;
};
// Update logged-in patient profile
export const updatePatientProfile = async (patientData) => {
    const response = await axiosInstance.put(
        "/patients/profile/me",
        patientData
    );
    return response.data;
};