import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

import { AuthService } from '../../core/services/auth';
import { EmployeeService } from '../../core/services/employee';
import { AppointmentService } from '../../core/services/appointment';
import { PatientService } from '../../core/services/patient';

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
  private readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  user: any = null;
  role: string | null = null;

  canViewEmployeeStats = false;

  totalEmployees = 0;
  activeEmployees = 0;
  pendingEmployees = 0;
  totalPatients=0;
  appointmentsCount = 0;

  ngOnInit(): void {
    this.role = this.authService.getRole()?.toUpperCase() || null;

    console.log('DASHBOARD ROLE:', this.role);

    this.canViewEmployeeStats = this.isAdminOrTechnician();

    this.loadProfile();

    if (this.canViewEmployeeStats) {
      this.loadEmployeesCount();
    }

    if (this.canViewAppointments()) {
      this.loadAppointmentsCount();
    }
    this.loadPatientsCount();
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
          this.role = this.user.role.toUpperCase();
        }

        this.canViewEmployeeStats = this.isAdminOrTechnician();

        if (this.canViewEmployeeStats) {
          this.loadEmployeesCount();
        }

        if (this.canViewAppointments()) {
          this.loadAppointmentsCount();
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

  private canViewAppointments(): boolean {
    return ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(this.role || '');
  }

  private loadAppointmentsCount(): void {
    this.appointmentService.getAppointments().subscribe({
      next: (response: any) => {
        console.log('DASHBOARD APPOINTMENTS RESPONSE:', response);

        let appointments: any[] = [];

        if (Array.isArray(response?.data)) {
          appointments = response.data;
        } else if (Array.isArray(response)) {
          appointments = response;
        }

        this.appointmentsCount = appointments.length;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('DASHBOARD APPOINTMENT COUNT ERROR:', error);

        this.appointmentsCount = 0;

        this.cdr.detectChanges();
      }
    });
  }

  goToEmployees(view: string): void {
    if (view === 'all') {
      this.router.navigate(['/employees']);
    } else {
      this.router.navigate(['/employees'], {
        queryParams: { view }
      });
    }
  }

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
  private loadPatientsCount(): void {

  this.patientService.getPatients().subscribe({

    next: (response: any) => {

      console.log('PATIENT RESPONSE:', response);

      this.totalPatients =
        response?.data?.count ||
        response?.data?.patients?.length ||
        0;

      this.cdr.detectChanges();
    },

    error: (error) => {

      console.error('PATIENT COUNT ERROR:', error);

      this.totalPatients = 0;

      this.cdr.detectChanges();
    }

  });

}
}
