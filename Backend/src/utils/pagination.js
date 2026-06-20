function getPagination(query) {
    const page = Math.max(parseInt(query.page) || 1, 1);

    // Add an upper bound (e.g., 100) to protect the server
    const rawLimit = parseInt(query.limit) || 10;
    const limit = Math.min(Math.max(rawLimit, 1), 100);

    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;

    return {
        page,
        limit,
        skip,
        sort: { [sortBy]: sortOrder }
    };
}
function buildPaginationResponse({ page, limit, totalRecords }) {
    const totalPages = Math.ceil(totalRecords / limit);
    return {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
}

module.exports = {
    getPagination,
    buildPaginationResponse
};
