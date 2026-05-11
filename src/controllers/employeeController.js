const Employee = require("../models/Employee");
const User = require("../models/User");

const createEmployee = async (req, res) => {

    try {

        const employee =
            await Employee.create(req.body);

        res.status(201).json(employee);

        const user =await User.create(req.body);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

const getEmployees = async (req, res) => {

    try {

        const employees =
            await Employee.find();

        res.json(employees);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createEmployee,
    getEmployees
};