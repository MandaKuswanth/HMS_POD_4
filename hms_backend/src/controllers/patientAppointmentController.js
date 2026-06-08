const Appointment = require("../models/Appointment");
const Employee = require("../models/Employee");
const User = require("../models/User");

const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

exports.getDoctors = async (req, res) => {
    try {

        const doctorUsers = await User.find({
            roles: "DOCTOR"
        });

        console.log("Doctor Users:", doctorUsers);

        const doctorEmployeeIds =
            doctorUsers.map(
                doctor => doctor.employeeId
            );

        console.log(
            "Doctor Employee IDs:",
            doctorEmployeeIds
        );

        const doctors =
            await Employee.find({
                employeeCode: {
                    $in: doctorEmployeeIds
                }
            });

        console.log("Doctors:", doctors);

        return res.status(200).json(
            new ApiResponse(
                200,
                doctors,
                "Doctors fetched successfully"
            )
        );

    } catch (err) {

        console.log(err);

        return res.status(500).json(
            new ApiError(
                500,
                err.message
            )
        );
    }
};

exports.bookAppointment = async (req, res) => {

    try {

        const {
            doctorEmployeeId,
            date,
            timeSlot
        } = req.body;

        const patientId = req.user.UHID;

        if (
            !doctorEmployeeId ||
            !date ||
            !timeSlot
        ) {

            return res.status(400).json(
                new ApiError(
                    400,
                    "All fields are required"
                )
            );
        }

        const doctor = await Employee.findOne({
            employeeCode: doctorEmployeeId,
            status: true
        });

        if (!doctor) {

            return res.status(404).json(
                new ApiError(
                    404,
                    "Doctor not found"
                )
            );
        }

        const existingAppointment =
            await Appointment.findOne({

                doctorEmployeeId,

                date: new Date(date),

                timeSlot,

                status: {
                    $ne: "CANCELLED"
                }
            });

        if (existingAppointment) {

            return res.status(409).json(
                new ApiError(
                    409,
                    "Selected slot is already booked"
                )
            );
        }

        const appointment =
            await Appointment.create({

                patientId,

                doctorEmployeeId,

                date,

                timeSlot,

                status: "PENDING"
            });

        return res.status(201).json(
            new ApiResponse(
                201,
                appointment,
                "Appointment request submitted successfully"
            )
        );

    } catch (err) {

        return res.status(500).json(
            new ApiError(
                500,
                err.message
            )
        );
    }
};

exports.getMyAppointments = async (req, res) => {

    try {

        const patientId = req.user.UHID;

        const appointments =
            await Appointment.find({
                patientId
            }).sort({
                createdAt: -1
            });

        const appointmentList =
            await Promise.all(

                appointments.map(
                    async appointment => {

                        const doctor =
                            await Employee.findOne({
                                employeeCode:
                                    appointment.doctorEmployeeId
                            });

                        return {
                            ...appointment.toObject(),
                            doctorName:
                                doctor?.name || "",
                            specialization:
                                doctor?.specialization || ""
                        };
                    }
                )
            );

        return res.status(200).json(
            new ApiResponse(
                200,
                appointmentList,
                "Appointments fetched successfully"
            )
        );

    } catch (err) {

        return res.status(500).json(
            new ApiError(
                500,
                err.message
            )
        );
    }
};

exports.updateMyAppointment = async (req, res) => {

    try {

        const { appointmentId } = req.params;

        const {
            date,
            timeSlot
        } = req.body;

        const appointment =
            await Appointment.findOne({
                appointmentId,
                patientId: req.user.UHID
            });

        if (!appointment) {

            return res.status(404).json(
                new ApiError(
                    404,
                    "Appointment not found"
                )
            );
        }

        if (appointment.status !== "PENDING") {

            return res.status(400).json(
                new ApiError(
                    400,
                    "Only pending appointments can be edited"
                )
            );
        }

        const existingAppointment =
            await Appointment.findOne({

                _id: {
                    $ne: appointment._id
                },

                doctorEmployeeId:
                    appointment.doctorEmployeeId,

                date: new Date(date),

                timeSlot,

                status: {
                    $ne: "CANCELLED"
                }
            });

        if (existingAppointment) {

            return res.status(409).json(
                new ApiError(
                    409,
                    "Selected slot is already booked"
                )
            );
        }

        appointment.date = date;
        appointment.timeSlot = timeSlot;

        await appointment.save();

        return res.status(200).json(
            new ApiResponse(
                200,
                appointment,
                "Appointment updated successfully"
            )
        );

    } catch (err) {

        return res.status(500).json(
            new ApiError(
                500,
                err.message
            )
        );
    }
};

exports.cancelMyAppointment = async (req, res) => {
    try {
        const {
            appointmentId
        } = req.params;
        const appointment = await Appointment.findOne({
            appointmentId,
            patientId: req.user.UHID
        });
        if (!appointment) {
            return res.status(404).json(new ApiError(404, "Appointment not found"));
        }
        if (appointment.status === "COMPLETED") {
            return res.status(400).json(new ApiError(400, "Completed appointment cannot be cancelled"));
        }
        appointment.status = "CANCELLED";
        await appointment.save();
        return res.status(200).json(new ApiResponse(200, appointment, "Appointment cancelled successfully"));
    } catch (err) {
        return res.status(500).json(new ApiError(500, err.message));
    }
};