import api from "../utils/api";

export const getMyHealthRecords = async ({
    page = 1,
    limit = 10,
} = {}) => {

    const response = await api.get(
        "/health-records/myHealthRecords",
        {
            params: {
                page,
                limit,
            },
        }
    );

    return response.data.data;
};
