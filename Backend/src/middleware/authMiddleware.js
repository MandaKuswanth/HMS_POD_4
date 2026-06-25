const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const ApiError = require("../utils/ApiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(401, "No authorization token provided");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        throw new ApiError(401, err.message || "Invalid or expired access token");
    }
});

module.exports = verifyJWT;