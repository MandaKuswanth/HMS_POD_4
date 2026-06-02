import React, { createContext, useState, useCallback } from "react";
import { Alert } from "react-native";

import {
  bookAppointment as apiBookAppointment,
  getMyAppointments as apiGetMyAppointments,
  getDoctors as apiGetDoctors,
  getAvailableSlots as apiGetAvailableSlots,
} from "../api/appointmentApi";

export const AppointmentContext = createContext();

export const AppointmentProvider = ({ children }) => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [loading, setLoading] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [slotLoading, setSlotLoading] = useState(false);

  const getAppointments = useCallback(async () => {
    setLoading(true);

    try {
      const response = await apiGetMyAppointments();

      console.log("Appointments API Response:", response);

      const appointmentList = response?.data || response || [];

      setAppointments(Array.isArray(appointmentList) ? appointmentList : []);
    } catch (error) {
      console.log(
        "Get Appointments Error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch appointments"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const getDoctors = useCallback(async (department) => {
    setDoctorLoading(true);

    try {
      const response = await apiGetDoctors(department);

      console.log("Doctors API Response:", response);

      const doctorList = response?.data || response || [];

      setDoctors(Array.isArray(doctorList) ? doctorList : []);

      return {
        success: true,
        data: doctorList,
      };
    } catch (error) {
      console.log(
        "Get Doctors Error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch doctors"
      );

      setDoctors([]);

      return {
        success: false,
        data: [],
      };
    } finally {
      setDoctorLoading(false);
    }
  }, []);

  const getAvailableSlots = useCallback(async (doctorEmployeeId, date) => {
    setSlotLoading(true);

    try {
      const response = await apiGetAvailableSlots(doctorEmployeeId, date);

      console.log("Slots API Response:", response);

      const slots = response?.data || response || [];

      setTimeSlots(Array.isArray(slots) ? slots : []);

      return {
        success: true,
        data: slots,
      };
    } catch (error) {
      console.log(
        "Get Slots Error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to fetch available slots"
      );

      setTimeSlots([]);

      return {
        success: false,
        data: [],
      };
    } finally {
      setSlotLoading(false);
    }
  }, []);

  const bookAppointment = useCallback(async (appointmentData) => {
    setLoading(true);

    try {
      console.log("Sending Appointment Data:", appointmentData);

      const response = await apiBookAppointment(appointmentData);

      console.log("Book Appointment API Response:", response);

      const newAppointment = response?.data || response;

      setAppointments((prevAppointments) => [
        newAppointment,
        ...prevAppointments,
      ]);

      return {
        success: true,
        data: newAppointment,
      };
    } catch (error) {
      console.log(
        "Book Appointment Error:",
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.message || "Failed to book appointment";

      Alert.alert("Error", message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        doctors,
        timeSlots,

        loading,
        doctorLoading,
        slotLoading,

        getAppointments,
        getDoctors,
        getAvailableSlots,
        bookAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};