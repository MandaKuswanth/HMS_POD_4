import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { ToastrService } from 'ngx-toastr';
import { RoleRequest, RoleService } from '../../../core/services/role';

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './role-dialouge.html',
  styleUrl: './role-dialouge.css',
})
export class RoleDialog {
  private readonly roleService = inject(RoleService);
  private readonly toastr = inject(ToastrService);

  loading = false;

  form: RoleRequest = {
    name: '',
    description: '',
    permissions: [],
    status: true,
  };

  permissionGroups = [
    {
      title: 'Dashboard',
      permissions: ['DASHBOARD_READ'],
    },
    {
      title: 'Employee Permissions',
      permissions: [
        'EMPLOYEE_CREATE',
        'EMPLOYEE_READ',
        'EMPLOYEE_UPDATE',
        'EMPLOYEE_DELETE',
      ],
    },
    {
      title: 'Patient Permissions',
      permissions: [
        'PATIENT_CREATE',
        'PATIENT_READ',
        'PATIENT_UPDATE',
        'PATIENT_DELETE',
      ],
    },
    {
      title: 'Appointment Permissions',
      permissions: [
        'APPOINTMENT_CREATE',
        'APPOINTMENT_READ',
        'APPOINTMENT_UPDATE',
        'APPOINTMENT_DELETE',
      ],
    },
    {
      title: 'Role Permissions',
      permissions: [
        'ROLE_CREATE',
        'ROLE_READ',
        'ROLE_UPDATE',
        'ROLE_DELETE',
      ],
    },
    {
      title: 'Node/Menu Permissions',
      permissions: [
        'NODE_CREATE',
        'NODE_READ',
        'NODE_UPDATE',
        'NODE_DELETE',
      ],
    },
    {
      title: 'Health Record Permissions',
      permissions: [
        'HEALTH_RECORD_CREATE',
        'HEALTH_RECORD_READ',
        'HEALTH_RECORD_UPDATE',
        'HEALTH_RECORD_DELETE',
      ],
    },
  ];

  constructor(
    private readonly dialogRef: MatDialogRef<RoleDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      mode: 'add' | 'edit';
      role?: RoleRequest;
    }
  ) {
    if (data.mode === 'edit' && data.role) {
      this.form = {
        roleId: data.role.roleId,
        name: data.role.name,
        description: data.role.description || '',
        permissions: [...(data.role.permissions || [])],
        status: data.role.status ?? true,
      };
    }
  }

  isChecked(permission: string): boolean {
    return this.form.permissions.includes(permission);
  }

  togglePermission(permission: string): void {
    if (this.isChecked(permission)) {
      this.form.permissions = this.form.permissions.filter(
        (item) => item !== permission
      );
    } else {
      this.form.permissions = [
        ...this.form.permissions,
        permission,
      ];
    }
  }

  formatPermission(permission: string): string {
    return permission
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (!this.form.name.trim()) {
      this.toastr.error('Role name is required');
      return;
    }

    this.loading = true;

    const payload: RoleRequest = {
      name: this.form.name.trim().toUpperCase(),
      description: this.form.description?.trim(),
      permissions: this.form.permissions,
      status: this.form.status,
    };

    const request =
      this.data.mode === 'edit' && this.form.roleId
        ? this.roleService.updateRole(this.form.roleId, payload)
        : this.roleService.createRole(payload);

    request.subscribe({
      next: (response: any) => {
        this.toastr.success(
          response?.message ||
            `Role ${this.data.mode === 'add' ? 'created' : 'updated'} successfully`
        );

        this.loading = false;
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;

        this.toastr.error(
          error?.error?.message || 'Failed to save role'
        );
      },
    });
  }
}