import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { Employee } from '../../../core/services/employee';
import { Auth } from '../../../core/services/auth';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private readonly employeeService = inject(Employee);
  private readonly authService = inject(Auth);
  private readonly toastr = inject(ToastrService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  employees: any[] = [];
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
    return this.authService.getRole()?.toUpperCase() === 'ADMIN';
  }

  get filteredEmployees(): any[] {
    return this.employees.filter((emp: any) =>
      this.activeView === 'active'
        ? emp.status === true
        : emp.status === false
    );
  }

  get activeCount(): number {
    return this.employees.filter((emp: any) => emp.status === true).length;
  }

  get pendingCount(): number {
    return this.employees.filter((emp: any) => emp.status === false).length;
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  toggleView(): void {
    this.activeView = this.activeView === 'active' ? 'pending' : 'active';
    this.cdr.detectChanges();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        console.log('EMPLOYEE LIST RESPONSE:', response);

        let employees: any[] = [];

        if (Array.isArray(response?.data)) {
          employees = response.data;
        } else if (Array.isArray(response)) {
          employees = response;
        }

        this.employees = employees;

        console.log('EMPLOYEES ARRAY:', this.employees);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('EMPLOYEE LIST ERROR:', error);

        this.employees = [];
        this.cdr.detectChanges();

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
      if (result) {
        this.loadEmployees();
      }
    });
  }

  openEditDialog(employee: any): void {
    const ref = this.dialog.open(EmployeeDialog, {
      data: {
        mode: 'edit',
        employee
      },
      width: '680px',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  deleteEmployee(employee: any): void {
    if (!employee?.employeeCode) {
      this.toastr.error('Employee code missing');
      return;
    }

    const confirmed = confirm(`Delete ${employee.name}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

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

  toggleEmployeeStatus(employee: any): void {
    if (!employee?.employeeCode) {
      this.toastr.error('Employee code missing');
      return;
    }

    const action = employee.status ? 'deactivate' : 'activate';

    const confirmed = confirm(`Are you sure you want to ${action} ${employee.name}?`);

    if (!confirmed) {
      return;
    }

    this.employeeService.toggleEmployeeStatus(employee.employeeCode).subscribe({
      next: (response: any) => {
        this.toastr.success(response?.message || `Employee ${action}d successfully`);
        this.loadEmployees();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Failed to update employee status');
      }
    });
  }
}