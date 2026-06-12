import api from "../utils/api";

import {
    unwrap,
} from "./authService";

export const getDoctorsApi = async () => {
    const response = await api.get(
        "/patientAppointment-auth/doctors"
    );

    return unwrap(response);
};

export const bookAppointmentApi = async (data) => {
    const response = await api.post(
        "/patientAppointment-auth/patient-appointments",
        data
    );

    return unwrap(response);
};

export const getMyAppointmentsApi = async () => {
    const response = await api.get(
        "/patientAppointment-auth/my-appointments"
    );

    return unwrap(response);
};

export const updateAppointmentApi = async (
    appointmentId,
    data
) => {
    const response = await api.put(
        `/patientAppointment-auth/patient-appointments/${appointmentId}`,
        data
    );

    return unwrap(response);
};

export const cancelAppointmentApi = async (
    appointmentId
) => {
    const response = await api.put(
        `/patientAppointment-auth/patient-appointments/${appointmentId}/cancel`,
        {}
    );

    return unwrap(response);
};
export const getDoctorSlotsApi = async (doctorEmployeeId, date) => {
    const response = await api.get(
        "/patientAppointment-auth/slots",
        {
            params: {
                doctorEmployeeId,
                date,
            },
        }
    );

    return unwrap(response);
};