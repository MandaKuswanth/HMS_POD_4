import {
  Component,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';



import { AuthService } from '../../core/services/auth';
import { EmployeeService } from '../../core/services/employee';
import { AppointmentService } from '../../core/services/appointment';
import { PatientService } from '../../core/services/patient';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../constants/permission';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    HasPermissionDirective,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
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
  role: string | null = null;

  totalEmployees = 0;
  activeEmployees = 0;
  pendingEmployees = 0;
  totalPatients = 0;
  appointmentsCount = 0;

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.role = this.authService.getRole()?.toUpperCase() || null;

    this.loadProfile();

    if (this.canViewEmployees()) {
      this.loadEmployeesCount();
    }

    if (this.canViewPatients()) {
      this.loadPatientsCount();
    }

    if (this.canViewAppointments()) {
      this.loadAppointmentsCount();
    }
  }

  canViewEmployees(): boolean {
    return this.authService.hasPermission('EMPLOYEE_READ');
  }

  canViewPatients(): boolean {
    return this.authService.hasPermission('PATIENT_READ');
  }

  canViewAppointments(): boolean {
    return this.authService.hasPermission('APPOINTMENT_READ');
  }

  private loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response: any) => {
        this.user =
          response?.data?.employee ||
          response?.employee ||
          response?.data ||
          this.user;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('PROFILE ERROR:', error);
      },
    });
  }

  private loadEmployeesCount(): void {
    this.employeeService.getEmployees(1, 1000).subscribe({
      next: (response: any) => {
        const employees = Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

        this.totalEmployees =
          response?.data?.pagination?.totalRecords || employees.length;

        this.activeEmployees = employees.filter(
          (emp: any) => emp.status === true
        ).length;

        this.pendingEmployees = employees.filter(
          (emp: any) => emp.status === false
        ).length;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('DASHBOARD EMPLOYEE COUNT ERROR:', err);
        this.totalEmployees = 0;
        this.activeEmployees = 0;
        this.pendingEmployees = 0;
        this.cdr.detectChanges();
      },
    });
  }

  private loadPatientsCount(): void {
    this.patientService.getPatients(1, 1000).subscribe({
      next: (response: any) => {
        const patients = Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

        this.totalPatients =
          response?.data?.pagination?.totalRecords || patients.length;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('PATIENT COUNT ERROR:', error);
        this.totalPatients = 0;
        this.cdr.detectChanges();
      },
    });
  }

  private loadAppointmentsCount(): void {
    this.appointmentService.getAppointments(1, 1000).subscribe({
      next: (response: any) => {
        const appointments = Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

        this.appointmentsCount =
          response?.data?.pagination?.totalRecords || appointments.length;

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('DASHBOARD APPOINTMENT COUNT ERROR:', error);
        this.appointmentsCount = 0;
        this.cdr.detectChanges();
      },
    });
  }

  goToEmployees(view: string): void {
    if (view === 'all') {
      this.router.navigate(['/employees']);
    } else {
      this.router.navigate(['/employees'], {
        queryParams: { view },
      });
    }
  }

  goToPatients(): void {
    this.router.navigate(['/patients']);
  }

  goToAppointments(): void {
    this.router.navigate(['/appointments']);
  }
}