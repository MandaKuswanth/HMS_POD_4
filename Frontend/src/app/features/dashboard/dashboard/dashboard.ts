import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { Auth } from '../../../core/services/auth';
import { Employee } from '../../../core/services/employee';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly authService = inject(Auth);
  private readonly employeeService = inject(Employee);
  private readonly cdr = inject(ChangeDetectorRef);

  user: any = null;
  role: string | null = null;

  canViewEmployeeStats = false;

  totalEmployees = 0;
  activeEmployees = 0;
  pendingEmployees = 0;

  ngOnInit(): void {
    this.role = this.authService.getRole();

    console.log('DASHBOARD ROLE:', this.role);

    this.canViewEmployeeStats = this.isAdminOrTechnician();

    this.loadProfile();

    if (this.canViewEmployeeStats) {
      this.loadEmployeesCount();
    }
  }

  isAdminOrTechnician(): boolean {
    const currentRole = this.role?.toUpperCase()?.trim();
    return currentRole === 'ADMIN' || currentRole === 'TECHNICIAN';
  }

  private loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response: any) => {
        console.log('PROFILE RESPONSE:', response);

        this.user =
          response?.data?.employee ||
          response?.employee ||
          response?.data ||
          response;

        if (!this.role && this.user?.role) {
          this.role = this.user.role;
        }

        this.canViewEmployeeStats = this.isAdminOrTechnician();

        if (this.canViewEmployeeStats) {
          this.loadEmployeesCount();
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('PROFILE ERROR:', error);
      }
    });
  }

  private loadEmployeesCount(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        console.log('DASHBOARD EMPLOYEE RESPONSE:', response);

        let employees: any[] = [];

        if (Array.isArray(response?.data)) {
          employees = response.data;
        } else if (Array.isArray(response)) {
          employees = response;
        }

        this.totalEmployees = employees.length;

        this.activeEmployees = employees.filter((emp: any) =>
          emp.status === true ||
          emp.isActive === true ||
          emp.is_active === true
        ).length;

        this.pendingEmployees = employees.filter((emp: any) =>
          emp.status === false ||
          emp.isActive === false ||
          emp.is_active === false
        ).length;

        console.log('DASHBOARD COUNTS:', {
          total: this.totalEmployees,
          active: this.activeEmployees,
          pending: this.pendingEmployees
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('DASHBOARD EMPLOYEE COUNT ERROR:', err);

        this.totalEmployees = 0;
        this.activeEmployees = 0;
        this.pendingEmployees = 0;

        this.cdr.detectChanges();
      }
    });
  }
}