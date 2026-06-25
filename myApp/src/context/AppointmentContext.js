import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from "react";
import PropTypes from "prop-types";
import {
    bookAppointmentApi,
    cancelAppointmentApi,
    getDoctorSlotsApi,
    getDoctorsApi,
    getMyAppointmentsApi,
    updateAppointmentApi,
} from "../api/appointmentService";

const AppointmentContext = createContext(null);

// const normalizeList = (payload) => {
//     const data = payload?.data || payload;
//     return Array.isArray(data) ? data : [];
// };
const normalizeList = (payload) => {
    console.log(payload);
    return Array.isArray(payload)
        ? payload
        : [];
};

const normalizeSlots = (payload, fallbackSlots = []) => {
    console.log(payload);
    const data = payload?.data || payload || {};

    return {
        allSlots: Array.isArray(data.allSlots) ? data.allSlots : fallbackSlots,
        bookedSlots: Array.isArray(data.bookedSlots) ? data.bookedSlots : [],
        availableSlots: Array.isArray(data.availableSlots)
            ? data.availableSlots
            : fallbackSlots,
    };
};

export function AppointmentProvider({ children }) {
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);

    const [doctorSlots, setDoctorSlots] = useState({
        allSlots: [],
        bookedSlots: [],
        availableSlots: [],
    });

    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const loadDoctors = useCallback(async () => {
        try {
            setDoctorsLoading(true);
            const payload = await getDoctorsApi();
            console.log(
    "DOCTORS RESPONSE:",
    JSON.stringify(payload, null, 2)
);
            setDoctors(normalizeList(payload));
        } catch (err) {
            console.log("LOAD DOCTORS ERROR:", err?.response?.data || err.message);
            setDoctors([]);
        } finally {
            setDoctorsLoading(false);
        }
    }, []);

    const loadAppointments = useCallback(async () => {
        try {
            setAppointmentsLoading(true);
            const payload = await getMyAppointmentsApi();
            setAppointments(normalizeList(payload));
        } catch (err) {
            console.log("LOAD APPOINTMENTS ERROR:", err?.response?.data || err.message);
            setAppointments([]);
        } finally {
            setAppointmentsLoading(false);
        }
    }, []);

    const loadDoctorSlots = useCallback(async (
        doctorEmployeeId,
        date,
        fallbackSlots = []
    ) => {
        if (!doctorEmployeeId || !date) {
            setDoctorSlots({
                allSlots: fallbackSlots,
                bookedSlots: [],
                availableSlots: fallbackSlots,
            });
            return;
        }

        try {
            setSlotsLoading(true);

            const payload = await getDoctorSlotsApi(
                doctorEmployeeId,
                date
            );

            setDoctorSlots(normalizeSlots(payload, fallbackSlots));
        } catch (err) {
            console.log("LOAD DOCTOR SLOTS ERROR:", err?.response?.data || err.message);

            setDoctorSlots({
                allSlots: fallbackSlots,
                bookedSlots: [],
                availableSlots: fallbackSlots,
            });
        } finally {
            setSlotsLoading(false);
        }
    }, []);

    const bookAppointment = useCallback(async (appointmentData) => {
        const result = await bookAppointmentApi(appointmentData);
        await loadAppointments();
        return result;
    }, [loadAppointments]);

    const updateAppointment = useCallback(async (
        appointmentId,
        appointmentData
    ) => {
        const result = await updateAppointmentApi(
            appointmentId,
            appointmentData
        );

        await loadAppointments();
        return result;
    }, [loadAppointments]);

    const cancelAppointment = useCallback(async (appointmentId) => {
        const result = await cancelAppointmentApi(appointmentId);
        await loadAppointments();
        return result;
    }, [loadAppointments]);

    const value = useMemo(() => ({
        doctors,
        appointments,
        doctorSlots,

        doctorsLoading,
        appointmentsLoading,
        slotsLoading,

        loadDoctors,
        loadAppointments,
        loadDoctorSlots,

        bookAppointment,
        updateAppointment,
        cancelAppointment,
    }), [
        doctors,
        appointments,
        doctorSlots,

        doctorsLoading,
        appointmentsLoading,
        slotsLoading,

        loadDoctors,
        loadAppointments,
        loadDoctorSlots,

        bookAppointment,
        updateAppointment,
        cancelAppointment,
    ]);

    return (
        <AppointmentContext.Provider value={value}>
            {children}
        </AppointmentContext.Provider>
    );
}

export const useAppointments = () => {
    const value = useContext(AppointmentContext);

    if (!value) {
        throw new Error(
            "useAppointments must be used inside AppointmentProvider"
        );
    }

    return value;
};
AppointmentProvider.propTypes = {
    children: PropTypes.node.isRequired,
};