const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {
    let error = err;

    if (!(error instanceof ApiError)) {
        error = new ApiError(
            err.statusCode || 500,
            err.message || "Internal Server Error",
            err.errors || [],
            err.stack
        );
    }

    return res.status(error.statusCode).json({
        statusCode: error.statusCode,
        data: null,
        message: error.message,
        success: false,
        errors: error.errors || []
    });
};

module.exports = errorMiddleware;