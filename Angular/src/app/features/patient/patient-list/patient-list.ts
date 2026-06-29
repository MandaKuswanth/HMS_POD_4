import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

import { PatientService, PatientRequest } from '../../../core/services/patient';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { PatientDialog } from '../patient-dialog/patient-dialog';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    HasPermissionDirective,
  ],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.css',
})
export class PatientList implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly patientService = inject(PatientService);
  private readonly toastr = inject(ToastrService);

  readonly PERMISSIONS = PERMISSIONS;
  readonly pageSizeOptions = [5, 10, 25, 50];

  displayedColumns: string[] = [
    'UHID',
    'name',
    'email',
    'phone',
    'gender',
    'dob',
    'status',
  ];

  // State Signals
  readonly patientsSignal = signal<PatientRequest[]>([]);
  readonly totalSignal = signal(0);
  readonly pageSignal = signal(0); // 0-indexed for MatPaginator
  readonly limitSignal = signal(5);
  readonly loadingSignal = signal(false);
  readonly errorSignal = signal<string | null>(null);
  readonly countsSignal = signal({ all: 0, active: 0, inactive: 0 });

  readonly searchTextSignal = signal('');
  readonly genderSignal = signal('ALL');
  readonly statusSignal = signal('ALL');
  readonly expandedPatientSignal = signal<PatientRequest | null>(null);
  readonly refreshSignal = signal(0);

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(val => {
      this.searchTextSignal.set(val);
      this.pageSignal.set(0);
    });

    // Reactive data loading effect
    effect(() => {
      const page = this.pageSignal() + 1; // 1-indexed for backend
      const limit = this.limitSignal();
      const search = this.searchTextSignal();
      const gender = this.genderSignal();
      const status = this.statusSignal();
      const refresh = this.refreshSignal();

      this.loadPatients(page, limit, search, gender, status);
    });
  }

  ngOnInit(): void {}

  loadPatients(page: number, limit: number, search: string, gender: string, status: string): void {
    this.loadingSignal.set(true);
    this.patientService
      .getPatients({ page, limit, search, gender, status, sortBy: 'createdAt', sortOrder: 'desc' })
      .subscribe({
        next: (response: any) => {
          this.loadingSignal.set(false);
          const records = Array.isArray(response?.data)
            ? response.data
            : (Array.isArray(response?.data?.records) ? response.data.records : []);

          this.patientsSignal.set(records);
          this.totalSignal.set(response?.pagination?.totalItems || response?.data?.pagination?.totalRecords || 0);
          
          if (response?.pagination?.counts || response?.data?.pagination?.counts) {
            this.countsSignal.set(response?.pagination?.counts || response?.data?.pagination?.counts);
          }
          this.errorSignal.set(null);
        },
        error: (err) => {
          this.loadingSignal.set(false);
          this.patientsSignal.set([]);
          this.totalSignal.set(0);
          this.errorSignal.set('Failed to load patients');
          this.toastr.error(err?.error?.message || 'Failed to load patients');
        },
      });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchSubject.next(val);
  }

  onGenderChange(val: string): void {
    this.genderSignal.set(val);
    this.pageSignal.set(0);
  }

  onStatusChange(val: string): void {
    this.statusSignal.set(val);
    this.pageSignal.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageSignal.set(event.pageIndex);
    this.limitSignal.set(event.pageSize);
    this.expandedPatientSignal.set(null);
  }

  toggleRow(row: PatientRequest): void {
    const current = this.expandedPatientSignal();
    this.expandedPatientSignal.set(current?.UHID === row.UHID ? null : row);
  }

  onRowClick(row: PatientRequest, event: Event): void {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    this.toggleRow(row);
  }

  clearFilters(): void {
    this.searchTextSignal.set('');
    this.genderSignal.set('ALL');
    this.statusSignal.set('ALL');
    this.pageSignal.set(0);
    this.expandedPatientSignal.set(null);
  }

  openAddDialog(): void {
    const ref = this.dialog.open(PatientDialog, {
      width: '800px',
      disableClose: true,
      data: { mode: 'add' },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.refreshSignal.update(v => v + 1);
        this.pageSignal.set(0);
      }
    });
  }

  editPatient(patient: PatientRequest): void {
    const ref = this.dialog.open(PatientDialog, {
      width: '800px',
      disableClose: true,
      data: {
        mode: 'edit',
        patient,
      },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.refreshSignal.update(v => v + 1);
      }
    });
  }

  viewPatient(patient: PatientRequest): void {
    this.dialog.open(PatientDialog, {
      width: '800px',
      data: {
        mode: 'view',
        patient,
      },
    });
  }

  deletePatient(patient: PatientRequest): void {
    if (!patient?.UHID) {
      this.toastr.error('Patient ID missing');
      return;
    }

    const confirmed = confirm(
      `Delete ${patient.name}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    this.patientService.deletePatient(patient.UHID).subscribe({
      next: () => {
        this.toastr.success('Patient deleted successfully');
        this.expandedPatientSignal.set(null);
        this.refreshSignal.update(v => v + 1);
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Delete failed'
        );
      },
    });
  }

  toggleStatus(patient: PatientRequest): void {
    if (!patient?.UHID) {
      return;
    }

    this.patientService.toggleStatus(patient.UHID).subscribe({
      next: () => {
        this.toastr.success('Status updated successfully');
        this.refreshSignal.update(v => v + 1);
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Status update failed'
        );
      },
    });
  }
}