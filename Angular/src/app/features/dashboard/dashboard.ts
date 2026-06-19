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
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../constants/permission';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Navbar,
    Sidebar,
    HasPermissionDirective
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

  readonly PERMISSIONS = PERMISSIONS;

  user: any = null;

  // Loading states
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

  // ── Permission helpers (replaces hardcoded role getters) ──────────────────
  get canViewEmployees(): boolean {
    return this.authService.hasPermission(PERMISSIONS.EMPLOYEE_VIEW);
  }

  get canViewAppointments(): boolean {
    return this.authService.hasPermission(PERMISSIONS.APPOINTMENT_VIEW);
  }

  get canViewPatients(): boolean {
    return this.authService.hasPermission(PERMISSIONS.PATIENT_VIEW);
  }

  get userName(): string {
    return this.user?.name || this.authService.getUser()?.email || 'User';
  }

  get userRoles(): string {
    return this.authService.getUser()?.roles?.map((r: any) => r.name).join(', ') || '';
  }

  ngOnInit(): void {
    this.loadProfile();

    // Load only what this user has permission to see
    if (this.canViewEmployees) this.loadEmployeesCount();
    if (this.canViewAppointments) this.loadAppointmentsCount();
    if (this.canViewPatients) this.loadPatientsCount();
  }

  private loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response: any) => {
        this.user = response?.data?.employee || response?.employee || response?.data || response;
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      },
      error: () => {
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
        this.activeEmployees = employees.filter((e: any) => e.status === true).length;
        this.pendingEmployees = employees.filter((e: any) => e.status === false).length;
        this.isLoadingEmployees = false;
        this.cdr.markForCheck();
      },
      error: () => {
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
      error: () => {
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
      error: () => {
        this.isLoadingPatients = false;
        this.cdr.markForCheck();
      }
    });
  }

  goToEmployees(view: string): void {
    this.router.navigate(['/employees'], { queryParams: view === 'all' ? {} : { view } });
  }

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
}