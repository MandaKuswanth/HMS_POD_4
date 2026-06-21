import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedQuery, buildQueryParams } from '../models/api-response.model';

export interface EmployeeRequest {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate?: string;
  medicalRegistrationNo?: string;
  specialization?: string;
  qualification?: string[];
  consultationFee?: number;
  availabilitySlots?: string[];
  role?: string;
  roles?: string[];
  status?: boolean;
  password?: string;
  confirmPassword?: string;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}/api/employees`;

  registerEmployee(data: EmployeeRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/register`, data);
  }

  adminAddEmployee(data: EmployeeRequest): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/admin/add-employee`, data);
  }

  getProfile(): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.baseUrl}/profile`);
  }

  getEmployees(query: PaginatedQuery = {}): Observable<ApiResponse<unknown[]>> {
    const params = new HttpParams({ fromObject: buildQueryParams(query) });
    return this.http.get<ApiResponse<unknown[]>>(`${this.baseUrl}/employees`, { params });
  }

  updateEmployee(employeeCode: string, data: Partial<EmployeeRequest>): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/employees/${employeeCode}`, data);
  }

  deleteEmployee(employeeCode: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/employees/${employeeCode}`);
  }

  getPendingEmployees(query: PaginatedQuery = {}): Observable<ApiResponse<unknown[]>> {
    const params = new HttpParams({ fromObject: buildQueryParams(query) });
    return this.http.get<ApiResponse<unknown[]>>(`${this.baseUrl}/pending-employees`, { params });
  }

  approveEmployee(userId: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/approve-employee/${userId}`, {});
  }

  rejectEmployee(userId: string): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.baseUrl}/reject-employee/${userId}`);
  }

  toggleEmployeeStatus(employeeCode: string): Observable<ApiResponse<unknown>> {
    return this.http.put<ApiResponse<unknown>>(`${this.baseUrl}/employees/${employeeCode}/toggle-status`, {});
  }
}
