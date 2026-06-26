import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
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

const APPOINTMENTS_PAGE_SIZE = 10;

const normalizeList = (payload) => {
    console.log(payload);
    return Array.isArray(payload)
        ? payload
        : [];
};

const normalizePaginatedAppointments = (payload) => {
    const appointments = Array.isArray(payload?.appointments)
        ? payload.appointments
        : normalizeList(payload);

    return {
        appointments,
        pagination: payload?.pagination || null,
    };
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
    const [appointmentsPage, setAppointmentsPage] = useState(1);
    const [appointmentsHasMore, setAppointmentsHasMore] = useState(true);
    const [appointmentTotalCount, setAppointmentTotalCount] = useState(0);

    const [doctorSlots, setDoctorSlots] = useState({
        allSlots: [],
        bookedSlots: [],
        availableSlots: [],
    });

    const [doctorsLoading, setDoctorsLoading] = useState(false);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsLoadingMore, setAppointmentsLoadingMore] =
        useState(false);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const appointmentsLoadingMoreRef = useRef(false);

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

    const loadAppointments = useCallback(async ({
        page = 1,
        append = false,
    } = {}) => {
        try {
            if (append) {
                setAppointmentsLoadingMore(true);
            } else {
                setAppointmentsLoading(true);
            }

            const payload = await getMyAppointmentsApi({
                page,
                limit: APPOINTMENTS_PAGE_SIZE,
            });

            const {
                appointments: nextAppointments,
                pagination,
            } = normalizePaginatedAppointments(payload);

            setAppointments((currentAppointments) =>
                append
                    ? [
                        ...currentAppointments,
                        ...nextAppointments,
                    ]
                    : nextAppointments
            );
            setAppointmentsPage(page);
            setAppointmentTotalCount(
                pagination?.totalRecords ??
                nextAppointments.length
            );
            setAppointmentsHasMore(
                pagination
                    ? page < pagination.totalPages
                    : nextAppointments.length === APPOINTMENTS_PAGE_SIZE
            );
        } catch (err) {
            console.log("LOAD APPOINTMENTS ERROR:", err?.response?.data || err.message);
            if (!append) {
                setAppointments([]);
                setAppointmentTotalCount(0);
                setAppointmentsHasMore(false);
            }
        } finally {
            setAppointmentsLoading(false);
            setAppointmentsLoadingMore(false);
        }
    }, []);

    const loadMoreAppointments = useCallback(async () => {
        if (
            appointmentsLoading ||
            appointmentsLoadingMore ||
            appointmentsLoadingMoreRef.current ||
            !appointmentsHasMore
        ) {
            return;
        }

        appointmentsLoadingMoreRef.current = true;

        try {
            await loadAppointments({
                page: appointmentsPage + 1,
                append: true,
            });
        } finally {
            appointmentsLoadingMoreRef.current = false;
        }
    }, [
        appointmentsHasMore,
        appointmentsLoading,
        appointmentsLoadingMore,
        appointmentsPage,
        loadAppointments,
    ]);

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
        appointmentsLoadingMore,
        slotsLoading,
        appointmentsHasMore,
        appointmentTotalCount,

        loadDoctors,
        loadAppointments,
        loadMoreAppointments,
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
        appointmentsLoadingMore,
        slotsLoading,
        appointmentsHasMore,
        appointmentTotalCount,

        loadDoctors,
        loadAppointments,
        loadMoreAppointments,
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
