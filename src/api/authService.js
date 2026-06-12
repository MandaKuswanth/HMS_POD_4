import api from "../utils/api";
export const unwrap=(response)=>response?.data?.data||response?.data||response;
export const registerPatient=async(data)=>unwrap(await api.post("/patient-auth/register",data));
export const loginPatient=async(data)=>unwrap(await api.post("/patient-auth/login",data));
