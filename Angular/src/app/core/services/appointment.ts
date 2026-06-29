import { Injectable, inject } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

export interface AppointmentRequest {

    patientId: string;

    doctorEmployeeId: string;

    date: string;

    timeSlot: string;

}

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {

    readonly http = inject(HttpClient);

    readonly baseUrl =
        'http://localhost:3000/api';

    createAppointment(
        data: AppointmentRequest
    ): Observable<any> {

        return this.http.post(
            `${this.baseUrl}/appointments`,
            data
        );
    }

  getAppointments(
    page = 1,
    limit = 5,
    search = '',
    status = 'ALL STATUS',
    doctorEmployeeId = 'ALL DOCTORS',
    date = ''
  ): Observable<any> {
    let url = `${this.baseUrl}/appointments?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'ALL STATUS') url += `&status=${encodeURIComponent(status)}`;
    if (doctorEmployeeId && doctorEmployeeId !== 'ALL DOCTORS') url += `&doctorEmployeeId=${encodeURIComponent(doctorEmployeeId)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;

    return this.http.get(url);
  }

  search = (query: string): Observable<any> => {
    return this.http.get<any>(`${this.baseUrl}/appointments/search?q=${query}&limit=10`);
  };

    deleteAppointment(
        appointmentId: string
    ): Observable<any> {

        return this.http.delete(
            `${this.baseUrl}/appointments/${appointmentId}`
        );
    }

    approveAppointment(appointmentId: string): Observable<any> {
        return this.http.put(
            `${this.baseUrl}/appointments/${appointmentId}/approve`,
            {}
        );
    }

    rejectAppointment(appointmentId: string): Observable<any> {
        return this.http.put(
            `${this.baseUrl}/appointments/${appointmentId}/reject`,
            {}
        );
    }

    getAppointmentById(
        appointmentId: string
    ): Observable<any> {
        return this.http.get(
            `${this.baseUrl}/appointments/${appointmentId}`
        );
    }

    updateAppointment(
        appointmentId: string,
        data: Partial<AppointmentRequest>
    ): Observable<any> {
        return this.http.put(
            `${this.baseUrl}/appointments/${appointmentId}`,
            data
        );
    }
    
    updateAppointmentStatus(
        appointmentId: string,
        status: string,
        cancellationReason?: string
    ): Observable<any> {
        return this.http.put(
            `${this.baseUrl}/appointments/${appointmentId}/status`,
            { status, cancellationReason }
        );
    }

    getStandardSlots(): Observable<any> {
        return this.http.get(
            `${this.baseUrl}/appointments/standard-slots`
        );
    }

    getDoctorSlots(doctorEmployeeId: string, date: string): Observable<any> {
        return this.http.get(
            `${this.baseUrl}/appointments/slots?doctorEmployeeId=${doctorEmployeeId}&date=${date}`
        );
    }
}