import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { PageShell } from '../../shared/components/page-shell/page-shell';
import { LoadingState } from '../../shared/components/loading-state/loading-state';
import { ToastService } from '../../shared/services/toast.service';
import { EmployeeService } from '../../core/services/employee';

interface ProfileRole {
  roleId: string;
  name: string;
}

interface ProfileResponse {
  employee: {
    name: string;
    email: string;
    phone: string;
    department: string;
    designation: string;
    employeeCode: string;
    status: boolean;
    joiningDate?: string;
    medicalRegistrationNo?: string;
    specialization?: string;
    qualification?: string[];
    consultationFee?: number;
    availabilitySlots?: string[];
  };
  user: {
    email: string;
    employeeId: string;
    status: boolean;
    mustResetPassword?: boolean;
    lastLogin?: string;
    roles: ProfileRole[];
  };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    PageShell,
    LoadingState,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  profile: ProfileResponse | null = null;
  loading = true;

  get employee() {
    return this.profile?.employee;
  }

  get user() {
    return this.profile?.user;
  }

  get roleNames(): string {
    return this.user?.roles?.map(r => r.name).join(', ') || 'N/A';
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.employeeService.getProfile().subscribe({
      next: (response) => {
        this.profile = (response as { data: ProfileResponse }).data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to load profile');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  isDoctor(): boolean {
    return this.user?.roles?.some(r => r.name === 'DOCTOR') ?? false;
  }
}
