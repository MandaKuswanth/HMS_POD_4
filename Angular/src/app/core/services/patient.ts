import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ensure correct path

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
  providedIn: 'root'
})
export class PatientService {

  private readonly http = inject(HttpClient);

  // Uses environment variable for production readiness
  private readonly baseUrl = `${environment.API_URL}/api/patients`;

  createPatient(data: PatientRequest): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  // Interceptor will automatically attach the Bearer token
  toggleStatus(uhid: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${uhid}/status`, {});
  }

  updatePatient(uhid: string, data: Partial<PatientRequest>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${uhid}`, data);
  }

  getPatients(): Observable<any> {
    return this.http.get(this.baseUrl);
  }

  // Added missing method to fetch a single patient by UHID
  getPatientById(uhid: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${uhid}`);
  }

  deletePatient(uhid: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${uhid}`);
  }
}