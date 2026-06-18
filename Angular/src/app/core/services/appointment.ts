import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Make sure this path is correct

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

    private readonly http = inject(HttpClient);

    // Use environment variable instead of hardcoding localhost
    private readonly baseUrl = `${environment.API_URL}/api`;

    /* ==========================================================
       STAFF / ADMIN ROUTES (Protected by adminReceptionistAccess)
       ========================================================== */

    createStaffAppointment(data: AppointmentRequest): Observable<any> {
        return this.http.post(`${this.baseUrl}/appointments`, data);
    }

    getStaffAppointments(): Observable<any> {
        return this.http.get(`${this.baseUrl}/appointments`);
    }

    deleteAppointment(appointmentId: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/appointments/${appointmentId}`);
    }

    approveAppointment(appointmentId: string): Observable<any> {
        return this.http.put(`${this.baseUrl}/appointments/${appointmentId}/approve`, {});
    }

    rejectAppointment(appointmentId: string): Observable<any> {
        return this.http.put(`${this.baseUrl}/appointments/${appointmentId}/reject`, {});
    }


}