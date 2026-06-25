import api from "../utils/api";

export const getMyHealthRecords = async () => {

    const response = await api.get(
        "/health-records/myHealthRecords"
    );

    return response.data.data;
};
