import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from '../../../shared/components/maincomponent/maincomponent';

import {
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';

import {
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { ToastrService } from 'ngx-toastr';

import { PatientService, PatientRequest } from '../../../core/services/patient';
import { PatientDialog } from '../patient-dialog/patient-dialog';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { PERMISSIONS } from '../../../constants/permission';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [
    MainComponent,
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

  displayedColumns: string[] = [
    'UHID',
    'name',
    'email',
    'phone',
    'gender',
    'dob',
    'status',
  ];

  dataSource = new MatTableDataSource<PatientRequest>([]);
  allPatients: PatientRequest[] = [];

  totalRecords = 0;
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25];

  searchText = '';
  selectedGender = 'ALL';
  selectedStatus = 'ALL';

  expandedPatient: PatientRequest | null = null;

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService
      .getPatients(this.pageIndex + 1, this.pageSize)
      .subscribe({
        next: (response: any) => {
          const patients = Array.isArray(response?.data?.records)
            ? response.data.records
            : [];

          this.allPatients = patients;
          this.dataSource.data = patients;

          this.totalRecords =
            response?.data?.pagination?.totalRecords || 0;

          this.expandedPatient = null;
        },
        error: (err) => {
          console.error('PATIENT LOAD ERROR:', err);

          this.allPatients = [];
          this.dataSource.data = [];
          this.totalRecords = 0;
          this.expandedPatient = null;

          this.toastr.error('Failed to load patients');
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.expandedPatient = null;

    this.loadPatients();
  }

  toggleRow(row: PatientRequest): void {
    this.expandedPatient =
      this.expandedPatient === row ? null : row;
  }

  onRowClick(row: PatientRequest, event: Event): void {
    const target = event.target as HTMLElement;

    if (target.closest('button')) {
      return;
    }

    this.toggleRow(row);
  }

  applyFilters(): void {
    let filtered = [...this.allPatients];

    const search = this.searchText.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter((p) =>
        (p.UHID ?? '').toLowerCase().includes(search) ||
        (p.name ?? '').toLowerCase().includes(search) ||
        (p.email ?? '').toLowerCase().includes(search) ||
        (p.phone ?? '').includes(search) ||
        (p.gender ?? '').toLowerCase().includes(search)
      );
    }

    if (this.selectedGender !== 'ALL') {
      filtered = filtered.filter(
        (p) => p.gender === this.selectedGender
      );
    }

    if (this.selectedStatus !== 'ALL') {
      const isActive = this.selectedStatus === 'ACTIVE';

      filtered = filtered.filter(
        (p) => p.status === isActive
      );
    }

    this.dataSource.data = filtered;
    this.expandedPatient = null;
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedGender = 'ALL';
    this.selectedStatus = 'ALL';

    this.dataSource.data = this.allPatients;
    this.expandedPatient = null;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(PatientDialog, {
      width: '800px',
      disableClose: true,
      data: { mode: 'add' },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.pageIndex = 0;
        this.loadPatients();
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
        this.loadPatients();
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
        this.expandedPatient = null;
        this.loadPatients();
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
        this.loadPatients();
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Status update failed'
        );
      },
    });
  }
}