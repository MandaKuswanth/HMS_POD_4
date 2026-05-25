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
        'http://localhost:5000/api';

    createAppointment(
        data: AppointmentRequest
    ): Observable<any> {

        return this.http.post(
            `${this.baseUrl}/appointments`,
            data
        );
    }

    getAppointments(): Observable<any> {

        return this.http.get(
            `${this.baseUrl}/appointments`
        );
    }

    deleteAppointment(
        appointmentId: string
    ): Observable<any> {

        return this.http.delete(
            `${this.baseUrl}/appointments/${appointmentId}`
        );
    }

}