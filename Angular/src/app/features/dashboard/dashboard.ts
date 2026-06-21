import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { PageShell } from '../../shared/components/page-shell/page-shell';
import { LoadingState } from '../../shared/components/loading-state/loading-state';
import { AuthService } from '../../core/services/auth';
import { EmployeeService } from '../../core/services/employee';
import { AppointmentService } from '../../core/services/appointment';
import { PatientService } from '../../core/services/patient';
import { HealthRecordService } from '../../core/services/health-record';
import { PERMISSIONS } from '../../constants/permission';

interface DashboardStat {
  title: string;
  value: string | number;
  icon: string;
  loading: boolean;
  route?: string;
  queryParams?: Record<string, string>;
  permissions: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    PageShell,
    LoadingState,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly employeeService = inject(EmployeeService);
  private readonly appointmentService = inject(AppointmentService);
  private readonly patientService = inject(PatientService);
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  readonly PERMISSIONS = PERMISSIONS;

  user: any = null;
  isLoadingProfile = true;
  stats: DashboardStat[] = [];

  get userName(): string {
    return this.user?.name || this.authService.getUser()?.email || 'User';
  }

  get userRoles(): string {
    return this.authService.getUser()?.roles?.map((r: any) => r.name).join(', ') || '';
  }

  get isDoctor(): boolean {
    return this.authService.hasRole('DOCTOR');
  }

  get isAdminLike(): boolean {
    return this.authService.hasAnyPermission([
      PERMISSIONS.EMPLOYEE_APPROVE,
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.EMPLOYEE_CREATE,
    ]);
  }

  ngOnInit(): void {
    this.buildStats();
    this.loadProfile();
    this.loadStats();
  }

  private buildStats(): void {
    this.stats = [
      {
        title: 'Total Employees',
        value: '-',
        icon: 'groups',
        loading: true,
        route: '/employees',
        permissions: [PERMISSIONS.EMPLOYEE_VIEW],
      },
      {
        title: 'Active Employees',
        value: '-',
        icon: 'check_circle',
        loading: true,
        route: '/employees',
        queryParams: { status: 'ACTIVE' },
        permissions: [PERMISSIONS.EMPLOYEE_VIEW],
      },
      {
        title: 'Pending Approvals',
        value: '-',
        icon: 'hourglass_empty',
        loading: true,
        route: '/pending-employees',
        permissions: [PERMISSIONS.EMPLOYEE_VIEW, PERMISSIONS.EMPLOYEE_APPROVE],
      },
      {
        title: 'Total Patients',
        value: '-',
        icon: 'personal_injury',
        loading: true,
        route: '/patients',
        permissions: [PERMISSIONS.PATIENT_VIEW],
      },
      {
        title: 'Appointments',
        value: '-',
        icon: 'event_available',
        loading: true,
        route: '/appointments',
        permissions: [PERMISSIONS.APPOINTMENT_VIEW],
      },
      {
        title: 'Health Records',
        value: '-',
        icon: 'medical_information',
        loading: true,
        route: '/health-records',
        permissions: [PERMISSIONS.HEALTH_RECORD_READ],
      },
    ];
  }

  visibleStats(): DashboardStat[] {
    return this.stats.filter(stat =>
      this.authService.hasAnyPermission(stat.permissions)
    );
  }

  private loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response) => {
        this.user = (response as any)?.data?.employee || (response as any)?.employee;
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadStats(): void {
    if (this.authService.hasPermission(PERMISSIONS.EMPLOYEE_VIEW)) {
      this.employeeService.getEmployees({ page: 1, limit: 1 }).subscribe({
        next: (res) => {
          this.updateStat('Total Employees', res.pagination?.totalRecords ?? 0);
          this.employeeService.getEmployees({ page: 1, limit: 1, status: 'ACTIVE' }).subscribe({
            next: (activeRes) => this.updateStat('Active Employees', activeRes.pagination?.totalRecords ?? 0),
          });
        },
      });
    }

    if (
      this.authService.hasPermission(PERMISSIONS.EMPLOYEE_VIEW) ||
      this.authService.hasPermission(PERMISSIONS.EMPLOYEE_APPROVE)
    ) {
      this.employeeService.getPendingEmployees({ page: 1, limit: 1 }).subscribe({
        next: (res) => this.updateStat('Pending Approvals', res.pagination?.totalRecords ?? 0),
      });
    }

    if (this.authService.hasPermission(PERMISSIONS.PATIENT_VIEW)) {
      this.patientService.getPatients({ page: 1, limit: 1 }).subscribe({
        next: (res) => this.updateStat('Total Patients', res.pagination?.totalRecords ?? 0),
      });
    }

    if (this.authService.hasPermission(PERMISSIONS.APPOINTMENT_VIEW)) {
      this.appointmentService.getStaffAppointments({ page: 1, limit: 1 }).subscribe({
        next: (res) => this.updateStat('Appointments', res.pagination?.totalRecords ?? 0),
      });
    }

    if (this.authService.hasPermission(PERMISSIONS.HEALTH_RECORD_READ)) {
      this.healthRecordService.getAllRecords({ page: 1, limit: 1 }).subscribe({
        next: (res) => this.updateStat('Health Records', res.pagination?.totalRecords ?? 0),
      });
    }
  }

  private updateStat(title: string, value: number): void {
    const stat = this.stats.find(item => item.title === title);
    if (stat) {
      stat.value = value;
      stat.loading = false;
      this.cdr.markForCheck();
    }
  }

  navigateTo(stat: DashboardStat): void {
    if (!stat.route) return;
    this.router.navigate([stat.route], { queryParams: stat.queryParams });
  }
}
