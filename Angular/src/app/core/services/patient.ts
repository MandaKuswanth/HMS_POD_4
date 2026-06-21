import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedQuery, buildQueryParams } from '../models/api-response.model';

export interface PatientRequest {
  UHID?: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup?: string;
  dob: string;
  address: string;
  status?: boolean;
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/api/patients`;

  createPatient(data: PatientRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(this.baseUrl, data);
  }

  toggleStatus(uhid: string): Observable<ApiResponse<unknown>> {
    return this.http.patch<ApiResponse<unknown>>(`${this.baseUrl}/${uhid}/status`, {});
  }

  updatePatient(uhid: string, data: Partial<PatientRequest>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/${uhid}`, data);
  }

  getPatients(query: PaginatedQuery = {}): Observable<ApiResponse<PatientRequest[]>> {
    const params = new HttpParams({ fromObject: buildQueryParams(query) });
    return this.http.get<ApiResponse<PatientRequest[]>>(this.baseUrl, { params });
  }

  getPatientById(uhid: string): Observable<ApiResponse<PatientRequest>> {
    return this.http.get<ApiResponse<PatientRequest>>(`${this.baseUrl}/${uhid}`);
  }

  deletePatient(uhid: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/${uhid}`);
  }
}
