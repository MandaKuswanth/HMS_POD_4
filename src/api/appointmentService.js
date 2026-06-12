import api from "../utils/api";import {unwrap} from "./authService";
export const getDoctorsApi=async()=>unwrap(await api.get("/patientAppointment-auth/doctors"));
export const getDoctorSlotsApi=async(doctorEmployeeId,date)=>unwrap(await api.get(`/patientAppointment-auth/doctors/${doctorEmployeeId}/slots`,{params:{date}}));
export const bookAppointmentApi=async(data)=>unwrap(await api.post("/patientAppointment-auth/patient-appointments",data));
export const getMyAppointmentsApi=async()=>unwrap(await api.get("/patientAppointment-auth/my-appointments"));
export const updateAppointmentApi=async(id,data)=>unwrap(await api.put(`/patientAppointment-auth/patient-appointments/${id}`,data));
export const cancelAppointmentApi=async(id)=>unwrap(await api.put(`/patientAppointment-auth/patient-appointments/${id}/cancel`,{}));
