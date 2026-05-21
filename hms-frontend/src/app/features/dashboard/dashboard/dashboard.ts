import { Component, OnInit, inject } from '@angular/core';
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
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private employeeService = inject(EmployeeService);

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

        this.user =
          response?.data?.employee ||
          response?.employee ||
          response?.data;
      },

      error: (error) => {
        console.error(error);
      }

    });

  }

  private loadEmployeesCount(): void {

    if (!this.isAdminOrTechnician()) {
      return;
    }

    this.employeeService.getEmployees().subscribe({

      next: (response) => {
        const employees =
          response?.data?.employees || [];

        this.totalEmployees =
          Array.isArray(employees)
            ? employees.length
            : 0;
      },
      error: () => {
        this.totalEmployees = 0;
      }

    });

  }
}