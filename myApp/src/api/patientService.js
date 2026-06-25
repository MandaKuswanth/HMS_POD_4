import api from "../utils/api";

import {
    unwrap,
} from "./authService";

export const updatePatientApi = async (
    uhid,
    data
) => {
    const response = await api.put(
        `/patient-auth/patient-profile/${uhid}`,
        data
    );

    return unwrap(response);
};