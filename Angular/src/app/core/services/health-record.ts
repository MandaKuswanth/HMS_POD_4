import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface HealthRecord {
  _id?: string;
  appointmentId?: string;
  patientId: string;
  employeeId?: string;
  symptoms: string;
  diagnosis: string;
  prescriptionItems?: any;
  notes?: string;
  created_at?: string;
  updatedAt?: string;
}

export interface HealthRecordResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: HealthRecord[];
}

export interface SingleHealthRecordResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: HealthRecord;
}

@Injectable({
  providedIn: 'root'
})
export class HealthRecordService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.API_URL}/api/medical-records`;

  getAllRecords(): Observable<HealthRecordResponse> {
    return this.http.get<HealthRecordResponse>(this.API_URL);
  }

  getRecordsByPatient(patientId: string): Observable<HealthRecordResponse> {
    return this.http.get<HealthRecordResponse>(`${this.API_URL}/patient/${patientId}`);
  }

  createRecord(record: Partial<HealthRecord>): Observable<SingleHealthRecordResponse> {
    return this.http.post<SingleHealthRecordResponse>(this.API_URL, record);
  }

  updateRecord(id: string, record: Partial<HealthRecord>): Observable<SingleHealthRecordResponse> {
    return this.http.put<SingleHealthRecordResponse>(`${this.API_URL}/${id}`, record);
  }

  deleteRecord(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }
}
