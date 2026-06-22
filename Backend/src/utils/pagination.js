const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1,1);
    const limit = Math.max(Number.parseInt(query.limit, 10) || 10,1);
    const skip = (page - 1) * limit;

    return {
        page, limit, skip
    };
};

const buildPaginationResponse = ({
    records,
    totalRecords,
    page,
    limit
}) => {
    return {
        records,
        pagination: {
            totalRecords,
            currentPage: page,
            totalPages: Math.ceil(totalRecords / limit),
            limit
        }
    };
};

module.exports = {
    getPagination,
    buildPaginationResponse
};