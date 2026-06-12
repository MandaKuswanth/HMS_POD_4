import api from "../utils/api";import {unwrap} from "./authService";
export const updatePatientApi=async(uhid,data)=>unwrap(await api.put(`/patient-auth/patient-profile/${uhid}`,data));
