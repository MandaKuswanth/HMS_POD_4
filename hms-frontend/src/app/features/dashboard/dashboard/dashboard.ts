import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { AuthService } from '../../../core/services/auth';
import { EmployeeService } from '../../../core/services/employee';

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
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Dashboard implements OnInit {

  readonly authService = inject(AuthService);
  readonly employeeService = inject(EmployeeService);
  readonly cdr = inject(ChangeDetectorRef);

  user: any = null;
  role: string | null = null;
  totalEmployees = 0;

  ngOnInit(): void {
    this.role = this.authService.getRole();

    this.loadProfile();
    this.loadEmployeesCount();
  }

  isAdminOrTechnician(): boolean {
    return this.authService.isAdminOrTechnician();
  }

  private loadProfile(): void {
    this.employeeService.getProfile().subscribe({
      next: (response) => {
        this.user = response?.data?.employee;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  private loadEmployeesCount(): void {
    if (!this.isAdminOrTechnician()) return;

    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        const employees = response?.data?.employees || [];

        this.totalEmployees = Array.isArray(employees)
          ? employees.length
          : 0;

        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading employees:', error);

        this.totalEmployees = 0;
        this.cdr.markForCheck();
      }
    });
  }
}