import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';

import { AuthService } from '../../core/services/auth';
import { EmployeeService } from '../../core/services/employee';
import { AppointmentService } from '../../core/services/appointment';
import { PatientService } from '../../core/services/patient';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush, // Added for max performance
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
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
  role: string = '';

  // Loading States
  isLoadingProfile = true;
  isLoadingEmployees = false;
  isLoadingAppointments = false;
  isLoadingPatients = false;

  // Counts
  totalEmployees = 0;
  activeEmployees = 0;
  pendingEmployees = 0;
  totalPatients = 0;
  appointmentsCount = 0;

  // RBAC Getters
  get isAdminOrTechnician(): boolean { return ['ADMIN', 'TECHNICIAN'].includes(this.role); }
  get isDoctor(): boolean { return this.role === 'DOCTOR'; }
  get isNurse(): boolean { return this.role === 'NURSE'; }
  get isReceptionist(): boolean { return this.role === 'RECEPTIONIST'; }
  get canViewAppointments(): boolean { return ['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(this.role); }
  get canViewPatients(): boolean { return ['ADMIN', 'RECEPTIONIST', 'NURSE', 'DOCTOR'].includes(this.role); }

  ngOnInit(): void {
    // 1. Establish Role immediately from token/local storage
    this.role = this.authService.getRole()?.toUpperCase().trim() || '';

    // 2. Fetch all required data concurrently rather than waiting for profile to finish
    this.loadProfile();

    if (this.isAdminOrTechnician) {
      this.loadEmployeesCount();
    }

    if (this.canViewAppointments) {
      this.loadAppointmentsCount();
    }

    if (this.canViewPatients) {
      this.loadPatientsCount();
    }
  }

  private loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response: any) => {
        this.user = response?.data?.employee || response?.employee || response?.data || response;
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('PROFILE ERROR:', error);
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadEmployeesCount(): void {
    this.isLoadingEmployees = true;
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        const employees = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);

        this.totalEmployees = employees.length;
        this.activeEmployees = employees.filter((emp: any) => emp.status === true || emp.isActive === true || emp.is_active === true).length;
        this.pendingEmployees = employees.filter((emp: any) => emp.status === false || emp.isActive === false || emp.is_active === false).length;

        this.isLoadingEmployees = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('DASHBOARD EMPLOYEE COUNT ERROR:', err);
        this.isLoadingEmployees = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadAppointmentsCount(): void {
    this.isLoadingAppointments = true;
    this.appointmentService.getStaffAppointments().subscribe({
      next: (response: any) => {
        const appointments = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
        this.appointmentsCount = appointments.length;
        this.isLoadingAppointments = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('DASHBOARD APPOINTMENT COUNT ERROR:', error);
        this.isLoadingAppointments = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadPatientsCount(): void {
    this.isLoadingPatients = true;
    this.patientService.getPatients().subscribe({
      next: (response: any) => {
        this.totalPatients = response?.data?.count || response?.data?.patients?.length || 0;
        this.isLoadingPatients = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('PATIENT COUNT ERROR:', error);
        this.isLoadingPatients = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Navigation
  goToEmployees(view: string): void {
    const queryParams = view === 'all' ? {} : { view };
    this.router.navigate(['/employees'], { queryParams });
  }

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
}