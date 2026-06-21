import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedQuery, buildQueryParams } from '../models/api-response.model';

export interface HealthRecord {
  _id?: string;
  appointmentId?: string;
  patientId: string;
  employeeId?: string;
  symptoms: string;
  diagnosis: string;
  prescriptionItems?: {
    name?: string;
    dosage?: string;
    duration?: string;
  };
  notes?: string;
  created_at?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class HealthRecordService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api/medical-records`;

  getAllRecords(query: PaginatedQuery = {}): Observable<ApiResponse<HealthRecord[]>> {
    const params = new HttpParams({ fromObject: buildQueryParams(query) });
    return this.http.get<ApiResponse<HealthRecord[]>>(this.API_URL, { params });
  }

  getRecordsByPatient(patientId: string): Observable<ApiResponse<HealthRecord[]>> {
    return this.http.get<ApiResponse<HealthRecord[]>>(`${this.API_URL}/patient/${patientId}`);
  }

  createRecord(record: Partial<HealthRecord>): Observable<ApiResponse<HealthRecord>> {
    return this.http.post<ApiResponse<HealthRecord>>(this.API_URL, record);
  }

  updateRecord(id: string, record: Partial<HealthRecord>): Observable<ApiResponse<HealthRecord>> {
    return this.http.put<ApiResponse<HealthRecord>>(`${this.API_URL}/${id}`, record);
  }

  deleteRecord(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }
}
