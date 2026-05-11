const Appointment = require("../models/Appointment");

const createAppointment = async (req, res) => {

    try {

        const appointment =
            await Appointment.create(req.body);

        res.status(201).json(appointment);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

const getAppointments = async (req, res) => {

    try {

        const appointments =
            await Appointment.find()
                .populate("patientId")
                .populate("doctorEmployeeId");

        res.json(appointments);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createAppointment,
    getAppointments
};