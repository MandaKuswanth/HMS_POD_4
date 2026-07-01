import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { MatAutocomplete, MatOption, MatAutocompleteModule } from '@angular/material/autocomplete';
import { finalize } from 'rxjs/operators';

import {
    CatalogPermission,
    PermissionCatalogService,
} from '../../core/services/permission-catalog';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../constants/permission';

@Component({
    selector: 'app-manage-permissions',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        HasPermissionDirective,
        MatAutocomplete,
        MatOption,
        MatAutocompleteModule,
    ],
    templateUrl: './manage-permissions.html',
    styleUrl: './manage-permissions.css',
})
export class ManagePermissions implements OnInit {
    private readonly permissionCatalogService = inject(PermissionCatalogService);
    private readonly toastr = inject(ToastrService);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly PERMISSIONS = PERMISSIONS;

    permissionGroups: { category: string; permissions: CatalogPermission[] }[] = [];
    loading = false;
    submitting = false;

    form = {
        key: '',
        label: '',
        category: '',
        description: '',
    };

    ngOnInit(): void {
        this.loadCatalog();
    }

    loadCatalog(): void {
        this.loading = true;
        this.cdr.detectChanges();

        this.permissionCatalogService
            .getCatalog()
            .pipe(
                finalize(() => {
                    this.loading = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (res) => {
                    this.permissionGroups = Object.entries(res.data).map(([category, permissions]) => ({
                        category,
                        permissions,
                    }));
                },
                error: (err) => {
                    console.error('Catalog load failed:', err);
                    this.toastr.error('Failed to load permission catalog');
                },
            });
    }

    get existingCategories(): string[] {
        return this.permissionGroups.map((g) => g.category);
    }

    onSubmit(): void {
        const key = this.form.key.trim().toUpperCase().replace(/\s+/g, '_');
        const label = this.form.label.trim();
        const category = this.form.category.trim();

        if (!key || !label || !category) {
            this.toastr.error('Key, label and category are required');
            return;
        }

        this.submitting = true;

        this.permissionCatalogService
            .createPermission({
                key,
                label,
                category,
                description: this.form.description?.trim(),
            })
            .pipe(
                finalize(() => {
                    this.submitting = false;
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: () => {
                    this.toastr.success('Permission added successfully');
                    this.resetForm();
                    this.loadCatalog();
                },
                error: (error) => {
                    console.error('Create permission failed:', error);
                    this.toastr.error(error?.error?.message || 'Failed to add permission');
                },
            });
    }

    deletePermission(perm: CatalogPermission): void {
        const confirmed = confirm(`Deactivate permission "${perm.label}"?`);
        if (!confirmed) return;

        this.permissionCatalogService.deletePermission(perm.key).subscribe({
            next: () => {
                this.toastr.success('Permission deactivated');
                this.loadCatalog();
            },
            error: (error) => {
                console.error('Delete permission failed:', error);
                this.toastr.error(error?.error?.message || 'Failed to deactivate permission');
            },
        });
    }

    resetForm(): void {
        this.form = { key: '', label: '', category: '', description: '' };
        this.cdr.detectChanges();
    }
}