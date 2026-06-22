import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { ToastrService } from 'ngx-toastr';

import { NodeService } from '../../../core/services/node';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-node-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './node-dialog.html',
  styleUrl: './node-dialog.css',
})
export class NodeDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<NodeDialog>);
  private readonly nodeService = inject(NodeService);
  private readonly toastr = inject(ToastrService);

  readonly permissionList = Object.values(PERMISSIONS);

  nodes: any[] = [];

  formData = {
    name: '',
    path: '',
    icon: '',
    permissions: [] as string[],
    parentNodeId: null as string | null,
    order: 0,
    status: true,
  };

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: any
  ) {}

  ngOnInit(): void {
    this.loadParentNodes();

    if (this.data?.mode === 'edit' && this.data?.node) {
      this.formData = {
        name: this.data.node.name || '',
        path: this.data.node.path || '',
        icon: this.data.node.icon || '',
        permissions: this.data.node.permissions || [],
        parentNodeId: this.data.node.parentNodeId || null,
        order: this.data.node.order ?? 0,
        status: this.data.node.status ?? true,
      };
    }
  }

  loadParentNodes(): void {
    this.nodeService.getNodes(1, 1000).subscribe({
      next: (response: any) => {
        const nodes = Array.isArray(response?.data?.records)
          ? response.data.records
          : [];

        this.nodes = nodes.filter(
          (node: any) =>
            node.nodeId !== this.data?.node?.nodeId
        );
      },
      error: () => {
        this.toastr.error('Failed to load parent nodes');
      },
    });
  }

  togglePermission(permission: string, checked: boolean): void {
    if (checked) {
      if (!this.formData.permissions.includes(permission)) {
        this.formData.permissions = [
          ...this.formData.permissions,
          permission,
        ];
      }

      return;
    }

    this.formData.permissions = this.formData.permissions.filter(
      (item) => item !== permission
    );
  }

  isPermissionSelected(permission: string): boolean {
    return this.formData.permissions.includes(permission);
  }

  save(): void {
    if (
      !this.formData.name.trim() ||
      !this.formData.path.trim() ||
      this.formData.permissions.length === 0
    ) {
      this.toastr.warning(
        'Name, path and at least one permission are required'
      );
      return;
    }

    const payload = {
      name: this.formData.name.trim(),
      path: this.formData.path.trim(),
      icon: this.formData.icon.trim(),
      permissions: this.formData.permissions,
      parentNodeId: this.formData.parentNodeId || null,
      order: Number(this.formData.order) || 0,
      status: this.formData.status,
    };

    const request$ =
      this.data?.mode === 'edit'
        ? this.nodeService.updateNode(
            this.data.node.nodeId,
            payload
          )
        : this.nodeService.createNode(payload);

    request$.subscribe({
      next: () => {
        this.toastr.success(
          this.data?.mode === 'edit'
            ? 'Node updated successfully'
            : 'Node created successfully'
        );

        this.dialogRef.close(true);
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to save node'
        );
      },
    });
  }
}