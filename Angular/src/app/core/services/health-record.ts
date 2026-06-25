import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface HealthRecordRequest {
  healthRecordId?: string;

  appointmentId: string;
  patientId: string;
  doctorEmployeeId: string;

  symptoms: string;
  diagnosis: string;
  prescription?: string;
  notes?: string;

  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  specialization?: string;

  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HealthRecordService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl =
    'http://localhost:3000/api/health-records';

  createHealthRecord(
    data: HealthRecordRequest
  ): Observable<any> {
    return this.http.post(
      this.baseUrl,
      data
    );
  }

  getHealthRecords(
    page = 1,
    limit = 5,
    search = ''
  ): Observable<any> {
    return this.http.get(
      `${this.baseUrl}?page=${page}&limit=${limit}&search=${search}`
    );
  }

  search = (query: string): Observable<any> => {
    return this.http.get<any>(`${this.baseUrl}/search?q=${query}&limit=10`);
  };

  getHealthRecordById(
    healthRecordId: string
  ): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/${healthRecordId}`
    );
  }

  updateHealthRecord(
    healthRecordId: string,
    data: Partial<HealthRecordRequest>
  ): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/${healthRecordId}`,
      data
    );
  }

  deleteHealthRecord(
    healthRecordId: string
  ): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/${healthRecordId}`
    );
  }

  getEligibleAppointments(): Observable<any> {
  return this.http.get(
    `${this.baseUrl}/eligible-appointments`
  );
}
}