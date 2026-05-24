import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';  

export interface EmployeeRequest {
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  medicalRegistrationNo?: string;
  specialization?: string;
  qualification?: string[];
  consultationFee?: number;
  availabilitySlots?: string[];
  role: string;
  status?: boolean;
}


@Injectable({
  providedIn: 'root'
})

export class EmployeeService {
  readonly http = inject(HttpClient);
  readonly baseUrl = 'http://localhost:5000/api';

  // Self register
  selfRegister(data: EmployeeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // Admin adds-employee
  adminAddEmployee(data: EmployeeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/add-employee`, data);
  }

  // Admin updates employee data
  updateEmployee(employeeCode: string, data: Partial<EmployeeRequest>): Observable<any> {
    return this.http.put(`${this.baseUrl}/admin/update-employee/${employeeCode}`, data);
  }

  // Admin deletes employee record
  deleteEmployee(employeeCode: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/admin/delete-employee/${employeeCode}`);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/me`);
  }

  getEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getEmployees`);
  }
  
  toggleEmployeeStatus(employeeCode: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/employees/${employeeCode}/status`, {});
  }
}