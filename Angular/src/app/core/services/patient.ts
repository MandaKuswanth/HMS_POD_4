import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  private readonly baseUrl = environment.apiUrl + '/api/patients';

  createPatient(data: PatientRequest): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  getPatients(
    page = 1,
    limit = 5,
    search = '',
    gender = 'ALL',
    status = 'ALL'
  ): Observable<any> {
    const params: any = {
      page,
      limit,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (gender !== 'ALL') {
      params.gender = gender;
    }

    if (status !== 'ALL') {
      params.status = status;
    }

    return this.http.get(this.baseUrl, { params });
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