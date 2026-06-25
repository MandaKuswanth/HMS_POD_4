const Medicine = require("../models/Medicine");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../middleware/asyncHandler");
const { paginateQuery } = require("../utils/pagination");

// ─── Create Medicine ─────────────────────────────────────────────────────────
exports.createMedicine = asyncHandler(async (req, res) => {
    const { name, sku, price, stock, status } = req.body;

    if (!name || !sku || price === undefined) {
        throw new ApiError(400, "name, sku, and price are required");
    }

    const existing = await Medicine.findOne({ sku: sku.trim(), isDeleted: false });
    if (existing) {
        throw new ApiError(409, `Medicine with SKU ${sku} already exists`);
    }

    const medicine = await Medicine.create({
        name,
        sku: sku.trim(),
        price,
        stock: stock || 0,
        status: status ?? true
    });

    return res.status(201).json(
        new ApiResponse(201, medicine, "Medicine created successfully")
    );
});

// ─── Get Medicines (Paginated) ───────────────────────────────────────────────
exports.getMedicines = asyncHandler(async (req, res) => {
    const baseFilter = { isDeleted: false };
    const searchFields = ["name", "sku"];

    const result = await paginateQuery({
        model: Medicine,
        query: req.query,
        baseFilter,
        searchFields,
        defaultSortField: "name"
    });

    return res.status(200).json(
        new ApiResponse(200, result.data, "Medicines fetched successfully", result.pagination)
    );
});

// ─── Autocomplete Medicine Search ────────────────────────────────────────────
exports.getMedicinesSearch = asyncHandler(async (req, res) => {
    const q = req.query.q || "";
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);

    const filter = { isDeleted: false, status: true };
    if (q.trim()) {
        filter.$or = [
            { name: { $regex: q.trim(), $options: "i" } },
            { sku: { $regex: q.trim(), $options: "i" } }
        ];
    }

    const medicines = await Medicine.find(filter)
        .select("_id sku name price stock")
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, medicines, "Medicines autocomplete fetched successfully")
    );
});

// ─── Get Medicine By ID ──────────────────────────────────────────────────────
exports.getMedicineById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const medicine = await Medicine.findOne({ _id: id, isDeleted: false });
    if (!medicine) {
        throw new ApiError(404, "Medicine not found");
    }

    return res.status(200).json(
        new ApiResponse(200, medicine, "Medicine fetched successfully")
    );
});

// ─── Update Medicine ─────────────────────────────────────────────────────────
exports.updateMedicine = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, sku, price, stock, status } = req.body;

    const medicine = await Medicine.findOne({ _id: id, isDeleted: false });
    if (!medicine) {
        throw new ApiError(404, "Medicine not found");
    }

    if (sku && sku.trim() !== medicine.sku) {
        const existing = await Medicine.findOne({ sku: sku.trim(), isDeleted: false });
        if (existing) {
            throw new ApiError(409, `Medicine with SKU ${sku} already exists`);
        }
        medicine.sku = sku.trim();
    }

    if (name !== undefined) medicine.name = name;
    if (price !== undefined) medicine.price = price;
    if (stock !== undefined) medicine.stock = stock;
    if (status !== undefined) medicine.status = status;

    await medicine.save();

    return res.status(200).json(
        new ApiResponse(200, medicine, "Medicine updated successfully")
    );
});

// ─── Delete Medicine ─────────────────────────────────────────────────────────
exports.deleteMedicine = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const medicine = await Medicine.findOne({ _id: id, isDeleted: false });
    if (!medicine) {
        throw new ApiError(404, "Medicine not found");
    }

    medicine.isDeleted = true;
    medicine.status = false;
    await medicine.save();

    return res.status(200).json(
        new ApiResponse(200, null, "Medicine deleted successfully")
    );
});
