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

const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};

const isBeforeDoctorJoiningDate = (appointmentDate, doctor) => {
    if (!doctor.joiningDate) {
        return false;
    }

    const joiningDate = normalizeAppointmentDate(doctor.joiningDate);
    return appointmentDate < joiningDate;
};

const generateStandardSlots = (startHour = 9, endHour = 17, intervalMinutes = 60) => {
    const slots = [];
    let currentHour = startHour;
    let currentMinute = 0;

    while (currentHour < endHour) {
        const startAmPm = currentHour >= 12 ? "PM" : "AM";
        const startH = currentHour > 12 ? currentHour - 12 : currentHour === 0 ? 12 : currentHour;
        const startM = currentMinute.toString().padStart(2, "0");

        const startStr = `${startH.toString().padStart(2, "0")}:${startM} ${startAmPm}`;

        let nextHour = currentHour;
        let nextMinute = currentMinute + intervalMinutes;

        if (nextMinute >= 60) {
            nextHour += Math.floor(nextMinute / 60);
            nextMinute %= 60;
        }

        const endAmPm = nextHour >= 12 ? "PM" : "AM";
        const endH = nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour;
        const endM = nextMinute.toString().padStart(2, "0");

        const endStr = `${endH.toString().padStart(2, "0")}:${endM} ${endAmPm}`;

        slots.push(`${startStr} - ${endStr}`);

        currentHour = nextHour;
        currentMinute = nextMinute;
    }

    return slots;
};

const getPastSlots = (slots, currentDate, appointmentDate) => {
    // Only check past slots if the appointment is for today
    if (normalizeAppointmentDate(appointmentDate).getTime() !== normalizeAppointmentDate(currentDate).getTime()) {
        return [];
    }

    const pastSlots = [];
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    slots.forEach((slot) => {
        // Example slot: "09:00 AM - 10:00 AM"
        const startTimeStr = slot.split("-")[0].trim(); // "09:00 AM"
        const [time, ampm] = startTimeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (ampm === "PM" && hours !== 12) {
            hours += 12;
        }
        if (ampm === "AM" && hours === 12) {
            hours = 0;
        }

        if (hours < currentHour || (hours === currentHour && minutes <= currentMinute)) {
            pastSlots.push(slot);
        }
    });

    return pastSlots;
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
    getTodayDate,
    generateStandardSlots,
    getPastSlots
};