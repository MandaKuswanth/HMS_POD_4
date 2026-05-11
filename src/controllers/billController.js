const Bill = require("../models/Bill");

const createBill = async (req, res) => {

    try {

        const bill =
            await Bill.create(req.body);

        res.status(201).json(bill);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

const getBills = async (req, res) => {

    try {

        const bills =
            await Bill.find()
                .populate("patientId")
                .populate("appointmentId");

        res.json(bills);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createBill,
    getBills
};