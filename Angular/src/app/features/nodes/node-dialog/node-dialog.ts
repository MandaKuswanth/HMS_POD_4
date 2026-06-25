import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { NodeService } from '../../../core/services/node';
import { SearchDropdownComponent } from '../../../shared/components/search-dropdown/search-dropdown';

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
    SearchDropdownComponent
  ],
  templateUrl: './node-dialog.html',
  styleUrl: './node-dialog.css',
})
export class NodeDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<NodeDialog>);
  readonly nodeService = inject(NodeService);
  private readonly toastr = inject(ToastrService);

  readonly data = inject<any>(MAT_DIALOG_DATA, { optional: true });

  formData = {
    name: '',
    path: '',
    icon: '',
    permissions: [] as string[],
    parentNodeId: null as string | null,
    order: 0,
    status: true,
  };

  ngOnInit(): void {
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

  searchParentNodes = (query: string): Observable<any> => {
    return this.nodeService.search(query).pipe(
      map((res: any) => {
        const list = res?.data || res || [];
        return list.filter((n: any) => n.nodeId !== this.data?.node?.nodeId);
      })
    );
  };

  searchStatus = (query: string): Observable<any> => {
    const list = [
      { _id: true, name: 'Active' },
      { _id: false, name: 'Inactive' }
    ];
    return of(list.filter(s => s.name.toLowerCase().includes(query.toLowerCase())));
  };

  onNameChange(value: string): void {
    this.formData.name = value;

    if (value.trim()) {
      const generated =
        value
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^A-Z0-9_]/g, '') + '_READ';

      this.formData.permissions = [generated];
    } else {
      this.formData.permissions = [];
    }
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