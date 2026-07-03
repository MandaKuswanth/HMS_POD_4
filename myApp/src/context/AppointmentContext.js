import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
} from "react";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
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

const doctorsSignal = signal([]);
const appointmentsSignal = signal([]);
const appointmentsPageSignal = signal(1);
const appointmentsHasMoreSignal = signal(true);
const appointmentTotalCountSignal = signal(0);

const doctorSlotsSignal = signal({
    allSlots: [],
    bookedSlots: [],
    availableSlots: [],
});

const doctorsLoadingSignal = signal(false);
const appointmentsLoadingSignal = signal(false);
const appointmentsLoadingMoreSignal = signal(false);
const slotsLoadingSignal = signal(false);

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
    useSignals();

    const doctors = doctorsSignal.value;
    const appointments = appointmentsSignal.value;
    const appointmentsPage = appointmentsPageSignal.value;
    const appointmentsHasMore = appointmentsHasMoreSignal.value;
    const appointmentTotalCount = appointmentTotalCountSignal.value;
    const doctorSlots = doctorSlotsSignal.value;
    const doctorsLoading = doctorsLoadingSignal.value;
    const appointmentsLoading = appointmentsLoadingSignal.value;
    const appointmentsLoadingMore = appointmentsLoadingMoreSignal.value;
    const slotsLoading = slotsLoadingSignal.value;
    const appointmentsLoadingMoreRef = useRef(false);

    const loadDoctors = useCallback(async () => {
        try {
            doctorsLoadingSignal.value = true;
            const payload = await getDoctorsApi();
            console.log(
    "DOCTORS RESPONSE:",
    JSON.stringify(payload, null, 2)
);
            doctorsSignal.value = normalizeList(payload);
        } catch (err) {
            console.log("LOAD DOCTORS ERROR:", err?.response?.data || err.message);
            doctorsSignal.value = [];
        } finally {
            doctorsLoadingSignal.value = false;
        }
    }, []);

    const loadAppointments = useCallback(async ({
        page = 1,
        append = false,
    } = {}) => {
        try {
            if (append) {
                appointmentsLoadingMoreSignal.value = true;
            } else {
                appointmentsLoadingSignal.value = true;
            }

            const payload = await getMyAppointmentsApi({
                page,
                limit: APPOINTMENTS_PAGE_SIZE,
            });

            const {
                appointments: nextAppointments,
                pagination,
            } = normalizePaginatedAppointments(payload);

            appointmentsSignal.value = append
                ? [
                    ...appointmentsSignal.value,
                    ...nextAppointments,
                ]
                : nextAppointments;
            appointmentsPageSignal.value = page;
            appointmentTotalCountSignal.value =
                pagination?.totalRecords ??
                nextAppointments.length;
            appointmentsHasMoreSignal.value = pagination
                ? page < pagination.totalPages
                : nextAppointments.length === APPOINTMENTS_PAGE_SIZE;
        } catch (err) {
            console.log("LOAD APPOINTMENTS ERROR:", err?.response?.data || err.message);
            if (!append) {
                appointmentsSignal.value = [];
                appointmentTotalCountSignal.value = 0;
                appointmentsHasMoreSignal.value = false;
            }
        } finally {
            appointmentsLoadingSignal.value = false;
            appointmentsLoadingMoreSignal.value = false;
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
            doctorSlotsSignal.value = {
                allSlots: fallbackSlots,
                bookedSlots: [],
                availableSlots: fallbackSlots,
            };
            return;
        }

        try {
            slotsLoadingSignal.value = true;

            const payload = await getDoctorSlotsApi(
                doctorEmployeeId,
                date
            );

            doctorSlotsSignal.value = normalizeSlots(payload, fallbackSlots);
        } catch (err) {
            console.log("LOAD DOCTOR SLOTS ERROR:", err?.response?.data || err.message);

            doctorSlotsSignal.value = {
                allSlots: fallbackSlots,
                bookedSlots: [],
                availableSlots: fallbackSlots,
            };
        } finally {
            slotsLoadingSignal.value = false;
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
