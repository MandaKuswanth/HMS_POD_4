import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

export interface PatientRequest {
  _id?: string;
  UHID?: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: any;
  status?: boolean;
  emergencyContact?: {
    name?: string;
    relation?: string;
    phone?: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/v1/patients';

  // Signals for state
  private readonly _patients = signal<PatientRequest[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Read-only signals
  readonly patients = this._patients.asReadonly();
  readonly total = this._total.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isEmpty = computed(() => this._patients().length === 0);

  createPatient(data: PatientRequest): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  getPatients(params: PaginationParams): Observable<any> {
    this._loading.set(true);
    const httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString())
      .set('search', params.search ?? '')
      .set('sortBy', params.sortBy ?? 'createdAt')
      .set('sortOrder', params.sortOrder ?? 'desc');

    return this.http.get<any>(this.baseUrl, { params: httpParams }).pipe(
      tap({
        next: (res) => {
          this._loading.set(false);
          const records = res?.data || [];
          this._patients.set(records);
          this._total.set(res?.pagination?.totalItems || 0);
          this._error.set(null);
        },
        error: (err) => {
          this._loading.set(false);
          this._error.set(err.message || 'Failed to load patients');
        }
      })
    );
  }

  // Autocomplete search
  search = (query: string): Observable<any> => {
    const httpParams = new HttpParams()
      .set('q', query)
      .set('limit', '10');
    return this.http.get<any>(`${this.baseUrl}/search`, { params: httpParams });
  };

  updatePatient(uhid: string, data: Partial<PatientRequest>): Observable<any> {
    return this.http.put(`${this.baseUrl}/${uhid}`, data);
  }

  deletePatient(uhid: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${uhid}`);
  }

  toggleStatus(uhid: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${uhid}/status`, {});
  }
}