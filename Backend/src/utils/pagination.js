/**
 * Helper to build pagination parameters (skip, limit, page).
 * Validates page > 0, limit > 0, max limit = 100.
 */
const buildPagination = (query) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Helper to build Mongoose sort query.
 */
const buildSort = (query, defaultField = "createdAt", defaultOrder = "desc") => {
    const sortBy = query.sortBy || defaultField;
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    return { [sortBy]: sortOrder };
};

/**
 * Helper to build Mongoose search regex query.
 */
const buildSearchFilter = (query, searchFields = []) => {
    const search = query.search || query.q || "";
    if (!search.trim() || !searchFields.length) return {};

    const conditions = searchFields.map((field) => ({
        [field]: { $regex: search.trim(), $options: "i" }
    }));

    return { $or: conditions };
};

/**
 * Combines all pagination, sorting, and filtering logic to return a paginated response object.
 */
const paginateQuery = async ({
    model,
    query,
    baseFilter = {},
    searchFields = [],
    defaultSortField = "createdAt",
    projection = null,
    populate = null
}) => {
    const { page, limit, skip } = buildPagination(query);
    const sort = buildSort(query, defaultSortField);
    const searchFilter = buildSearchFilter(query, searchFields);

    const filter = { ...baseFilter, ...searchFilter };

    const totalItems = await model.countDocuments(filter);

    let dbQuery = model.find(filter).sort(sort).skip(skip).limit(limit);

    if (projection) {
        dbQuery = dbQuery.select(projection);
    }

    if (populate) {
        dbQuery = dbQuery.populate(populate);
    }

    const data = await dbQuery.lean();
    const totalPages = Math.ceil(totalItems / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
};

module.exports = {
    buildPagination,
    buildSort,
    buildSearchFilter,
    paginateQuery
};