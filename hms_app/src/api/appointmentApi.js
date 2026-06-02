import axiosInstance from "./axiosConfig";

// Get doctors by department
export const getDoctors = async (department) => {
    const response = await axiosInstance.get("/appointments/patient/doctors", {
        params: {
            department,
        },
    });

    return response.data;
};

// Get available slots by doctor and date
export const getAvailableSlots = async (doctorEmployeeId, date) => {
    const response = await axiosInstance.get(
        "/appointments/patient/available-slots",
        {
            params: {
                doctorEmployeeId,
                date,
            },
        }
    );

    return response.data;
};

// Book appointment by patient
export const bookAppointment = async (appointmentData) => {
    const response = await axiosInstance.post(
        "/appointments/patient/book",
        appointmentData
    );

    return response.data;
};

// Get logged-in patient appointments
export const getMyAppointments = async () => {
    const response = await axiosInstance.get(
        "/appointments/patient/my-appointments"
    );

    return response.data;
};