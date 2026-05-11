const User = require("../models/User");

const bcrypt = require("bcryptjs");

const generateToken =
    require("../utils/generateToken");

const signup = async (req, res) => {

    try {

        const {
            username,
            email,
            password,
            roles
        } = req.body;

        const existingUser =
            await User.findOne({ email });

        if (existingUser) {

            return res.status(400).json({
                message: "User already exists"
            });
        }

        const user = await User.create({

            username,

            email:employee.email,

            passwordHash: password,

            roles
        });

        res.status(201).json({

            _id: user._id,

            username: user.username,

            email: user.email,

            roles: user.roles,

            token: generateToken(user._id)
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

const login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user =
            await User.findOne({ email });

        if (!user) {

            return res.status(401).json({
                message: "Invalid email"
            });
        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.passwordHash
            );

        if (!isMatch) {

            return res.status(401).json({
                message: "Invalid password"
            });
        }

        user.lastLoginAt = new Date();

        await user.save();

        res.json({

            _id: user._id,

            username: user.username,

            email: user.email,

            roles: user.roles,

            token: generateToken(user._id)
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    signup,
    login
};