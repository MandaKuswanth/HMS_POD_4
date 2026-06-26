const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const patientService = require("../services/patientService");

exports.registerPatient = asyncHandler(async (req, res) => {
    const { patient, user } = await patientService.registerPatient(req.body);

    return res.status(201).json(
        new ApiResponse(
            201,
            {
                patient,
                user: {
                    id: user._id,
                    email: user.email,
                    UHID: user.UHID,
                    roleIds: user.roleIds,
                    status: user.status
                }
            },
            "Patient registered successfully"
        )
    );
});