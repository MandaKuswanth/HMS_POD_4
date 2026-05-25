import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PatientRequest {

    name: string;

    phone: string;

    email: string;

    gender: string;

    dob: string;

    address?: string;

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
        'http://localhost:5000/api';

    createPatient(
        data: PatientRequest
    ): Observable<any> {

        return this.http.post(
            `${this.baseUrl}/patients`,
            data
        );
    }

    getPatients(): Observable<any> {

        return this.http.get(
            `${this.baseUrl}/patients`
        );
    }

    deletePatient(
        uhid: string
    ): Observable<any> {

        return this.http.delete(
            `${this.baseUrl}/patients/${uhid}`
        );
    }

}