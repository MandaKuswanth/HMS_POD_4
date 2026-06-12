const Appointment = require("../models/Appointment");

const SLOT_BLOCKING_STATUSES = ["PENDING", "BOOKED", "IN-PROCESS"];

const getDateRange = (dateValue) => {
    const startOfDay = new Date(dateValue);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    return { startOfDay, endOfDay };
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

    const joiningDate = normalizeAppointmentDate(doctor.joiningDate);
    return appointmentDate < joiningDate;
};

const findSlotConflict = async ({
    doctorEmployeeId,
    patientId,
    date,
    timeSlot,
    excludeAppointmentId,
}) => {
    const { startOfDay, endOfDay } = getDateRange(date);

    const query = {
        date: {
            $gte: startOfDay,
            $lt: endOfDay,
        },
        timeSlot,
        status: {
            $in: SLOT_BLOCKING_STATUSES,
        },
    };

    if (doctorEmployeeId) {
        query.doctorEmployeeId = doctorEmployeeId;
    }

    if (patientId) {
        query.patientId = patientId;
    }

    if (excludeAppointmentId) {
        query._id = {
            $ne: excludeAppointmentId,
        };
    }

    return Appointment.findOne(query);
};

module.exports = {
    SLOT_BLOCKING_STATUSES,
    getDateRange,
    normalizeAppointmentDate,
    getTomorrowDate,
    isBeforeDoctorJoiningDate,
    findSlotConflict,
};