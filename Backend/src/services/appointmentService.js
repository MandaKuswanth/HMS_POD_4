const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Role = require("../models/Role");
const ApiError = require("../utils/ApiError");
const emailService = require("./emailService");
const {
    SLOT_BLOCKING_STATUSES,
    normalizeAppointmentDate,
    findSlotConflict,
    generateStandardSlots,
    isBeforeDoctorJoiningDate,
    getTodayDate,
    getPastSlots
} = require("../utils/appointmentHelpers");

const STATUS_TRANSITIONS = {
    PENDING: ["BOOKED", "CANCELLED"],
    BOOKED: ["IN-PROCESS", "CANCELLED"],
    "IN-PROCESS": ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: []
};

class AppointmentService {
    async verifyDoctorByPermissions(doctorEmployeeCode) {
        const doctorUser = await User.findOne(
            { employeeId: doctorEmployeeCode, isDeleted: false, status: true },
            { roleIds: 1, status: 1 }
        ).lean();

        if (!doctorUser) {
            return { valid: false, reason: "Doctor user account not found or is inactive" };
        }

        const roles = await Role.find(
            { roleId: { $in: doctorUser.roleIds }, status: true },
            { permissions: 1 }
        ).lean();

        const perms = new Set(roles.flatMap((r) => r.permissions || []));

        if (!perms.has("HEALTH_RECORD_CREATE")) {
            return { valid: false, reason: "Employee is not a doctor" };
        }

        return { valid: true };
    }

    async validatePatientAndDoctor(patientId, doctorEmployeeId) {
        const patient = await Patient.findOne(
            { UHID: patientId, isDeleted: false },
            { name: 1, email: 1, status: 1 }
        ).lean();

        if (!patient) throw new ApiError(404, "Patient not found");
        if (!patient.status) throw new ApiError(400, "Patient account is inactive");

        const doctor = await Employee.findOne(
            { employeeCode: doctorEmployeeId, isDeleted: false },
            { name: 1, status: 1, joiningDate: 1 }
        ).lean();

        if (!doctor) {
            throw new ApiError(404, "Doctor not found with provided employee code");
        }

        if (!doctor.status) {
            throw new ApiError(400, "Doctor account is inactive");
        }

        const { valid, reason } = await this.verifyDoctorByPermissions(doctorEmployeeId);
        if (!valid) throw new ApiError(400, reason);

        return { patient, doctor };
    }

    validateAppointmentDate(date, doctor) {
        const appointmentDate = normalizeAppointmentDate(date);

        if (Number.isNaN(appointmentDate.getTime())) {
            throw new ApiError(400, "Invalid date format");
        }

        if (appointmentDate < getTodayDate()) {
            throw new ApiError(400, "Appointments cannot be booked for past dates");
        }

        if (isBeforeDoctorJoiningDate(appointmentDate, doctor)) {
            throw new ApiError(400, "Appointment cannot be booked before doctor's joining date");
        }

        return appointmentDate;
    }

    async validateSlotConflicts({ patientId, doctorEmployeeId, date, timeSlot, excludeAppointmentId }) {
        const doctorConflict = await findSlotConflict({
            doctorEmployeeId,
            date,
            timeSlot,
            excludeAppointmentId
        });

        if (doctorConflict) {
            throw new ApiError(409, "Doctor is already booked for this slot on the selected date");
        }

        const patientConflict = await findSlotConflict({
            patientId,
            date,
            timeSlot,
            excludeAppointmentId
        });

        if (patientConflict) {
            throw new ApiError(409, "Patient already has an appointment at this date and time slot");
        }
    }

    async getDoctorSlots(doctorEmployeeId, date) {
        const appointmentDate = normalizeAppointmentDate(date);
        if (Number.isNaN(appointmentDate.getTime())) {
            throw new ApiError(400, "Invalid date format");
        }

        const doctor = await Employee.findOne(
            { employeeCode: doctorEmployeeId, isDeleted: false },
            { availabilitySlots: 1 }
        ).lean();

        if (!doctor) {
            throw new ApiError(404, "Doctor not found");
        }

        const allSlots = Array.isArray(doctor.availabilitySlots) && doctor.availabilitySlots.length > 0
            ? doctor.availabilitySlots
            : generateStandardSlots();

        const appointments = await Appointment.find({
            doctorEmployeeId,
            date: appointmentDate,
            status: { $in: SLOT_BLOCKING_STATUSES },
            isDeleted: false
        }).lean();

        const bookedSlots = appointments.map((app) => app.timeSlot);
        const pastSlots = getPastSlots(allSlots, new Date(), appointmentDate);

        return { allSlots, bookedSlots, pastSlots };
    }

    async createAppointment({ patientId, doctorEmployeeId, date, timeSlot, reason, createdByEmployeeId }) {
        const appointmentDate = normalizeAppointmentDate(date);
        
        const { patient, doctor } = await this.validatePatientAndDoctor(patientId, doctorEmployeeId);
        this.validateAppointmentDate(appointmentDate, doctor);

        await this.validateSlotConflicts({ patientId, doctorEmployeeId, date: appointmentDate, timeSlot });

        const isCreatedByPatient = createdByEmployeeId === null;
        const initialStatus = isCreatedByPatient ? "PENDING" : "BOOKED";

        const appointment = await Appointment.create({
            patientId,
            doctorEmployeeId,
            date: appointmentDate,
            timeSlot,
            reason: reason || "",
            status: initialStatus,
            createdByEmployeeId: isCreatedByPatient ? undefined : createdByEmployeeId
        });

        if (initialStatus === "BOOKED" && patient.email) {
            await emailService.sendAppointmentConfirmed(patient.email, patient.name, appointmentDate.toDateString(), timeSlot);
        }

        return appointment;
    }

    async updateAppointment(appointmentId, { patientId, doctorEmployeeId, date, timeSlot, reason, userEmployeeId, userPermissions }) {
        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) throw new ApiError(404, "Appointment not found");

        if (["COMPLETED", "CANCELLED"].includes(appointment.status)) {
            throw new ApiError(400, `Cannot reschedule a ${appointment.status.toLowerCase()} appointment`);
        }

        const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
        const hasRead = userPermissions.has("APPOINTMENT_READ");
        const isDoctor = !hasApprove && hasRead && appointment.doctorEmployeeId === userEmployeeId;

        if (!hasApprove && !isDoctor) {
            throw new ApiError(403, "You do not have permission to reschedule this appointment");
        }

        const appointmentDate = normalizeAppointmentDate(date);
        
        const { patient, doctor } = await this.validatePatientAndDoctor(patientId, doctorEmployeeId);
        this.validateAppointmentDate(appointmentDate, doctor);

        await this.validateSlotConflicts({ 
            patientId, 
            doctorEmployeeId, 
            date: appointmentDate, 
            timeSlot, 
            excludeAppointmentId: appointment._id 
        });

        appointment.patientId = patientId;
        appointment.doctorEmployeeId = doctorEmployeeId;
        appointment.date = appointmentDate;
        appointment.timeSlot = timeSlot;
        if (reason !== undefined) appointment.reason = reason;

        await appointment.save();

        if (patient.email && appointment.status === "BOOKED") {
            await emailService.sendAppointmentConfirmed(patient.email, patient.name, appointmentDate.toDateString(), timeSlot);
        }

        return appointment;
    }

    async updateAppointmentStatus({ appointmentId, newStatus, cancellationReason, userPermissions, userEmployeeId }) {
        const appointment = await Appointment.findOne({ appointmentId, isDeleted: false });
        if (!appointment) {
            throw new ApiError(404, "Appointment not found");
        }

        const hasApprove = userPermissions.has("APPOINTMENT_APPROVE");
        const hasRead = userPermissions.has("APPOINTMENT_READ");
        const isDoctor = !hasApprove && hasRead && appointment.doctorEmployeeId === userEmployeeId;

        const canUpdateByAdmin = hasApprove && ["PENDING", "BOOKED", "IN-PROCESS"].includes(appointment.status);
        const canUpdateByDoctor = isDoctor && ["BOOKED", "IN-PROCESS"].includes(appointment.status);

        if (!canUpdateByAdmin && !canUpdateByDoctor) {
            throw new ApiError(403, "You do not have permission to update this appointment's status");
        }

        let allowedNext = [];
        if (hasApprove) {
            allowedNext = STATUS_TRANSITIONS[appointment.status] || [];
        } else if (isDoctor) {
            if (appointment.status === "BOOKED") allowedNext = ["IN-PROCESS"];
            if (appointment.status === "IN-PROCESS") allowedNext = ["COMPLETED"];
        }

        if (!allowedNext.includes(newStatus)) {
            throw new ApiError(400, `Cannot change status from ${appointment.status} to ${newStatus}`);
        }

        if (newStatus === "CANCELLED") {
            if (!cancellationReason || cancellationReason.trim() === "") {
                throw new ApiError(400, "Cancellation reason is required when cancelling an appointment");
            }
            appointment.cancellationReason = cancellationReason.trim();
        }

        appointment.status = newStatus;
        if (newStatus === "COMPLETED") {
            appointment.completedAt = new Date();
        }

        await appointment.save();

        const patient = await Patient.findOne({ UHID: appointment.patientId, isDeleted: false });

        if (patient?.email) {
            if (newStatus === "BOOKED" && appointment.status === "PENDING") {
                await emailService.sendAppointmentApproved(patient.email, patient.name, appointment.date.toDateString(), appointment.timeSlot);
            } else if (newStatus === "CANCELLED" && appointment.status === "PENDING") {
                await emailService.sendAppointmentRejected(patient.email, patient.name, appointment.date.toDateString(), appointment.timeSlot, cancellationReason);
            } else if (newStatus === "CANCELLED") {
                await emailService.sendAppointmentCancelled(patient.email, patient.name, appointment, cancellationReason);
            }
        }

        return appointment;
    }

    async cancelDoctorAppointments(doctorEmployeeId, reason) {
        const appointments = await Appointment.find({
            doctorEmployeeId,
            isDeleted: false,
            status: { $nin: ["CANCELLED", "COMPLETED"] }
        });

        let cancelledCount = 0;

        for (const appointment of appointments) {
            appointment.status = "CANCELLED";
            appointment.cancellationReason = reason;
            await appointment.save();

            const patient = await Patient.findOne({
                UHID: appointment.patientId,
                isDeleted: false
            });

            if (patient?.email) {
                await emailService.sendAppointmentCancelled(patient.email, patient.name, appointment, reason);
            }
            cancelledCount++;
        }
        return cancelledCount;
    }
}

module.exports = new AppointmentService();
