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
  providedIn: 'root'
})
export class PatientService {

  readonly http = inject(HttpClient);

  readonly baseUrl =
    'http://localhost:3000/api/patients';

  createPatient(
    data: PatientRequest
        ): Observable<any> {

        return this.http.post(
        `${this.baseUrl}`,
        data
        );
  }
  toggleStatus(uhid: string) {
    const token = localStorage.getItem('token');

    return this.http.patch(
      `${this.baseUrl}/${uhid}/status`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }


  updatePatient(
    uhid: string,
    data: any
  ): Observable<any> {

    return this.http.put(
      `${this.baseUrl}/${uhid}`,
      data
    );
  }

  getPatients(): Observable<any> {

    return this.http.get(
      `${this.baseUrl}`
    );
  }

  deletePatient(
    uhid: string
  ): Observable<any> {

    return this.http.delete(
      `${this.baseUrl}/${uhid}`
    );
  }

}