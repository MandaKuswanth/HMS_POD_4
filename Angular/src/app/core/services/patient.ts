import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PatientRequest {
  UHID?: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  status?: boolean;
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:3000/api/patients';

  createPatient(data: PatientRequest): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  getPatients(
    page = 1,
    limit = 5
  ): Observable<any> {

    return this.http.get(
      `${this.baseUrl}?page=${page}&limit=${limit}`
    );

  }

  updatePatient(
    uhid: string,
    data: Partial<PatientRequest>
  ): Observable<any> {
    return this.http.put(`${this.baseUrl}/${uhid}`, data);
  }

  deletePatient(uhid: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${uhid}`);
  }

  toggleStatus(uhid: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${uhid}/status`, {});
  }
}