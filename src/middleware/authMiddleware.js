const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {

    try {

        const token =
            req.headers.authorization.split(" ")[1];

        const decoded =
            jwt.verify(token, process.env.JWT_SECRET);

        req.user =
            await User.findById(decoded.id);

        next();

    } catch (error) {

        res.status(401).json({
            message: "Unauthorized"
        });
    }
};

module.exports = protect;