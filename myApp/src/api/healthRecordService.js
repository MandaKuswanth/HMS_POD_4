import api from "../utils/api";

export const getMyHealthRecords = async (page = 1, limit = 10) => {
    const response = await api.get(
        `/health-records/myHealthRecords?page=${page}&limit=${limit}`
    );
    return response.data;
};
