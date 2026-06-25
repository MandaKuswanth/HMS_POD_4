import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  role: string;
  status?: boolean;
  password?: string;
  confirmPassword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = 'http://localhost:3000/api/employees';

  // Public employee registration
  registerEmployee(data: EmployeeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // Admin adds employee
  adminAddEmployee(data: EmployeeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/admin/add-employee`, data);
  }

  // Logged-in employee profile
  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`);
  }

  // Get all employees
  getEmployees(page = 1, limit = 5, search = '', department = 'ALL DEPARTMENTS', role = 'ALL ROLES', status = 'all'): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/employees?page=${page}&limit=${limit}&search=${search}&department=${department}&role=${role}&status=${status}`
    );
  }

  search = (query: string): Observable<any> => {
    return this.http.get<any>(`${this.baseUrl}/search?q=${query}&limit=10`);
  };

  searchDoctors = (query: string): Observable<any> => {
    return this.http.get<any>(`http://localhost:3000/api/doctors/search?q=${query}&limit=10`);
  };

  // Update employee
  updateEmployee(employeeCode: string, data: Partial<EmployeeRequest>): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${employeeCode}`, data);
  }

  // Delete employee
  deleteEmployee(employeeCode: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/employees/${employeeCode}`);
  }

  // Pending employee registrations
  getPendingEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/pending-employees`);
  }

  // Approve employee
  approveEmployee(userId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/approve-employee/${userId}`, {});
  }

  // Reject employee
  rejectEmployee(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/reject-employee/${userId}`);
  }

  // Toggle employee status
  toggleEmployeeStatus(employeeCode: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${employeeCode}/toggle-status`, {});
  }
}