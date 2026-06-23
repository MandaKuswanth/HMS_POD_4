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
  limit = 5
): Observable<any> {
  return this.http.get(
    `${this.baseUrl}/appointments?page=${page}&limit=${limit}`
  );
}

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
    status: string
): Observable<any> {
    return this.http.put(
        `${this.baseUrl}/appointments/${appointmentId}/status`,
        { status }
    );
}
}