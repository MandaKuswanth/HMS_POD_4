import React,{createContext,useCallback,useContext,useMemo,useState}from"react";
import{bookAppointmentApi,cancelAppointmentApi,getDoctorSlotsApi,getDoctorsApi,getMyAppointmentsApi,updateAppointmentApi}from"../api/appointmentService";
const AppointmentContext=createContext(null);
const list=(p)=>Array.isArray(p?.data||p)?(p?.data||p):[];
const normSlots=(p,fallback=[])=>{const d=p?.data||p||{};return{allSlots:Array.isArray(d.allSlots)?d.allSlots:fallback,bookedSlots:Array.isArray(d.bookedSlots)?d.bookedSlots:[],availableSlots:Array.isArray(d.availableSlots)?d.availableSlots:fallback}};
export function AppointmentProvider({children}){const[doctors,setDoctors]=useState([]),[appointments,setAppointments]=useState([]),[doctorSlots,setDoctorSlots]=useState({allSlots:[],bookedSlots:[],availableSlots:[]}); const[doctorsLoading,setDoctorsLoading]=useState(false),[appointmentsLoading,setAppointmentsLoading]=useState(false),[slotsLoading,setSlotsLoading]=useState(false);
const loadDoctors=useCallback(async()=>{try{setDoctorsLoading(true);setDoctors(list(await getDoctorsApi()));}finally{setDoctorsLoading(false)}},[]);
const loadAppointments=useCallback(async()=>{try{setAppointmentsLoading(true);setAppointments(list(await getMyAppointmentsApi()));}finally{setAppointmentsLoading(false)}},[]);
const loadDoctorSlots=useCallback(async(id,date,fallback=[])=>{if(!id||!date){setDoctorSlots({allSlots:fallback,bookedSlots:[],availableSlots:fallback});return} try{setSlotsLoading(true);setDoctorSlots(normSlots(await getDoctorSlotsApi(id,date),fallback));}catch(e){setDoctorSlots({allSlots:fallback,bookedSlots:[],availableSlots:fallback});}finally{setSlotsLoading(false)}},[]);
const bookAppointment=useCallback(async(data)=>{const r=await bookAppointmentApi(data); await loadAppointments(); return r;},[loadAppointments]);
const updateAppointment=useCallback(async(id,data)=>{const r=await updateAppointmentApi(id,data); await loadAppointments(); return r;},[loadAppointments]);
const cancelAppointment=useCallback(async(id)=>{const r=await cancelAppointmentApi(id); await loadAppointments(); return r;},[loadAppointments]);
const value=useMemo(()=>({doctors,appointments,doctorSlots,doctorsLoading,appointmentsLoading,slotsLoading,loadDoctors,loadAppointments,loadDoctorSlots,bookAppointment,updateAppointment,cancelAppointment}),[doctors,appointments,doctorSlots,doctorsLoading,appointmentsLoading,slotsLoading,loadDoctors,loadAppointments,loadDoctorSlots,bookAppointment,updateAppointment,cancelAppointment]);
return <AppointmentContext.Provider value={value}>{children}</AppointmentContext.Provider>}
export const useAppointments=()=>{const v=useContext(AppointmentContext);if(!v)throw new Error("useAppointments must be used inside AppointmentProvider");return v;};
