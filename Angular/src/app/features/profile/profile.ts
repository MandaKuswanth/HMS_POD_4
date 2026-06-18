import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Sidebar } from '../../shared/components/sidebar/sidebar';
import { EmployeeService } from '../../core/services/employee';

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  private readonly cdr = inject(ChangeDetectorRef);

  employee: any = null;
  loading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response: any) => {
        // Safe extraction of employee data based on your backend structure
        this.employee = response?.data?.employee || response?.employee || response?.data || null;

        this.loading = false;
        this.cdr.markForCheck(); // ✅ tells OnPush to re-render
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isDoctor(): boolean {
    // Array-safe check in case your backend uses `roles: ['DOCTOR']` instead of `role: 'DOCTOR'`
    if (!this.employee) return false;

    if (Array.isArray(this.employee.roles)) {
      return this.employee.roles.includes('DOCTOR');
    }
    return this.employee.role === 'DOCTOR';
  }
}