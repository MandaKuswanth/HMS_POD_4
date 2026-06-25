const AuditEvent = require("../models/AuditEvent");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// ─── Get Audit Logs (Paginated) ──────────────────────────────────────────────
exports.getAuditLogs = asyncHandler(async (req, res) => {
    const baseFilter = {};
    const searchFields = ["userId", "action", "details"];

    const result = await paginateQuery({
        model: AuditEvent,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "createdAt"
    });

    return res.status(200).json(
        new ApiResponse(200, result.data, "Audit logs fetched successfully", result.pagination)
    );
});

// ─── Create Audit Event (Internal Helper) ─────────────────────────────────────
exports.logEvent = async (userId, action, details = "", ipAddress = "") => {
    try {
        await AuditEvent.create({
            userId,
            action,
            details,
            ipAddress
        });
    } catch (err) {
        console.error("Failed to log audit event:", err);
    }
};
