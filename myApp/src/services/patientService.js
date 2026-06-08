import api from "../utils/api";

export const updatePatient = async (
    uhid,
    patientData,
    token
) => {

    const response = await api.put(
        `/patient-profile/${uhid}`,
        patientData,
        {
            headers: {
                Authorization:
                    `Bearer ${token}`
            }
        }
    );

    return response.data;
};