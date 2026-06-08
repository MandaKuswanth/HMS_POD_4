import api from "../utils/api";

export const getDoctors = async (token) => {

    const response = await api.get(
        "/doctors",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
};

export const bookAppointment = async (
    appointmentData,
    token
) => {

    const response = await api.post(
        "/patient-appointments",
        appointmentData,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
};

export const getMyAppointments = async (
    token
) => {

    const response = await api.get(
        "/my-appointments",
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;
};

export const updateAppointment = async (
    appointmentId,
    appointmentData,
    token
) => {

    const response = await api.put(
        `/patient-appointments/${appointmentId}`,
        appointmentData,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

    return response.data;
};

export const cancelAppointment = async (
    appointmentId,
    token
) => {

    const response = await api.put(
        `/patient-appointments/${appointmentId}/cancel`,
        {},
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

    return response.data;
};