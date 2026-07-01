import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
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
import { CatalogPermission, PermissionCatalogService } from '../../../core/services/permission-catalog';

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
export class RoleDialog implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly toastr = inject(ToastrService);
  private readonly permissionCatalogService = inject(PermissionCatalogService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;

  form: RoleRequest = {
    name: '',
    description: '',
    permissions: [],
    status: true,
  };

  permissionGroups: { category: string; permissions: CatalogPermission[] }[] = [];

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

  ngOnInit(): void {
    this.loadCatalog();
  }

  loadCatalog(): void {
    this.permissionCatalogService.getCatalog().subscribe({
      next: (res) => {
        this.permissionGroups = Object.entries(res.data).map(([category, permissions]) => ({
          category,
          permissions,
        }));
        this.cdr.detectChanges(); // force sync so the view reflects the new groups this tick
      },
      error: () => this.toastr.error('Failed to load permission catalog'),
    });
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
      this.form.permissions = [...this.form.permissions, permission];
    }
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