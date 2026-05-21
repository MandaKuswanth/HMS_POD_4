import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { EmployeeService } from '../../../core/services/employee';
import { AuthService } from '../../../core/services/auth';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnInit {
  private employeeService = inject(EmployeeService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);

  employees: any[] = [];

  /** Controls which set is visible: 'active' | 'pending' */
  activeView: 'active' | 'pending' = 'active';

  displayedColumns: string[] = [
    'employeeCode',
    'name',
    'email',
    'phone',
    'department',
    'designation',
    'role',
    'status',
    'actions'
  ];

  get isAdmin(): boolean {
    return this.authService.getRole() === 'ADMIN';
  }

  /** Employees shown in the table based on current view */
  get filteredEmployees(): any[] {
    return this.employees.filter(emp =>
      this.activeView === 'active' ? emp.status : !emp.status
    );
  }

  get activeCount(): number {
    return this.employees.filter(emp => emp.status).length;
  }

  get pendingCount(): number {
    return this.employees.filter(emp => !emp.status).length;
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  toggleView(): void {
    this.activeView = this.activeView === 'active' ? 'pending' : 'active';
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        const employees = response?.data?.employees || [];
        const users = response?.data?.user || [];

        this.employees = employees.map((employee: any) => {
          const matchingUser = users.find((u: any) => u.email === employee.email);
          return {
            ...employee,
            role: matchingUser?.roles || matchingUser?.role || 'N/A'
          };
        });

        if (!Array.isArray(this.employees)) this.employees = [];
      },
      error: () => {
        this.employees = [];
        this.toastr.warning('Failed to load employees');
      }
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(EmployeeDialog, {
      data: { mode: 'add' },
      width: '680px',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadEmployees();
    });
  }

  openEditDialog(employee: any): void {
    const ref = this.dialog.open(EmployeeDialog, {
      data: { mode: 'edit', employee },
      width: '680px',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result) this.loadEmployees();
    });
  }

  deleteEmployee(employee: any): void {
    if (!confirm(`Delete ${employee.name}? This cannot be undone.`)) return;

    this.employeeService.deleteEmployee(employee.employeeCode).subscribe({
      next: () => {
        this.toastr.success('Employee deleted successfully');
        this.loadEmployees();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to delete employee');
      }
    });
  }
}