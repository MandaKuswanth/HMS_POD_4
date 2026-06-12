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
  readonly employeeService = inject(EmployeeService);
  readonly cdr = inject(ChangeDetectorRef);

  employee: any = null;
  loading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response) => {
        this.employee =
          response?.data?.employee ||
          response?.employee ||
          response?.data;

        this.loading = false;
        this.cdr.markForCheck(); // ✅ tells OnPush to re-render
      },
      error: (error) => {
        console.error(error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isDoctor(): boolean {
    return this.employee?.role === 'DOCTOR';
  }
}