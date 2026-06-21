import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedQuery, buildQueryParams } from '../models/api-response.model';

export interface AppointmentRequest {
  patientId: string;
  doctorEmployeeId: string;
  date: string;
  timeSlot: string;
}

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/api`;

  createStaffAppointment(data: AppointmentRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/appointments`, data);
  }

  getStaffAppointments(query: PaginatedQuery = {}): Observable<ApiResponse<unknown[]>> {
    const params = new HttpParams({ fromObject: buildQueryParams(query) });
    return this.http.get<ApiResponse<unknown[]>>(`${this.baseUrl}/appointments`, { params });
  }

  getAppointmentById(appointmentId: string): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.baseUrl}/appointments/${appointmentId}`);
  }

  updateAppointment(appointmentId: string, data: Partial<AppointmentRequest>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/appointments/${appointmentId}`, data);
  }

  deleteAppointment(appointmentId: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/appointments/${appointmentId}`);
  }

  approveAppointment(appointmentId: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/appointments/${appointmentId}/approve`, {});
  }

  rejectAppointment(appointmentId: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/appointments/${appointmentId}/reject`, {});
  }
}
