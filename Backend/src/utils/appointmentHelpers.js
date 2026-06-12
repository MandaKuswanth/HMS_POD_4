// src/utils/appointmentHelpers.js

const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

const getDateRange = (dateValue) => {
    const startOfDay = new Date(dateValue);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    return {
        startOfDay,
        endOfDay,
    };
};

const normalizeAppointmentDate = (date) => {
    const appointmentDate = new Date(date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate;
};

const getTomorrowDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return tomorrow;
};

const isBeforeDoctorJoiningDate = (appointmentDate, doctor) => {
    if (!doctor.joiningDate) {
        return false;
    }

    const doctorJoiningDate = new Date(doctor.joiningDate);
    doctorJoiningDate.setHours(0, 0, 0, 0);

    return appointmentDate < doctorJoiningDate;
};

module.exports = {
    SLOT_BLOCKING_STATUSES,
    getDateRange,
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
};