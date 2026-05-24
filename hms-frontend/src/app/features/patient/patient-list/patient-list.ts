import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastrService } from 'ngx-toastr';

import { Navbar } from '../../../shared/components/navbar/navbar';
import { Sidebar } from '../../../shared/components/sidebar/sidebar';
import { PatientService } from '../../../core/services/patient';
import { PatientDialog } from '../patient-dialog/patient-dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-patient-list',
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
  templateUrl: './patient-list.html',
  styleUrls: ['./patient-list.css'],
  changeDetection: ChangeDetectionStrategy.OnPush // ✅ added
})
export class PatientList implements OnInit {

  private patientService = inject(PatientService);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef); // ✅ added

  patients: any[] = [];

  displayedColumns: string[] = [
    'UHID',
    'name',
    'email',
    'phone',
    'gender',
    'dob',
    'status',
    'actions'
  ];

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (response) => {
        this.patients = response?.data || [];

        this.cdr.markForCheck(); 
      },
      error: () => {
        this.toastr.error('Failed to load patients');
      }
    });
  }

  openAddDialog(): void {
    const ref = this.dialog.open(PatientDialog, {
      width: '720px',
      disableClose: true
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadPatients();
      }
    });
  }

  deletePatient(patient: any): void {
    const confirmed = confirm(`Delete patient ${patient.name}?`);

    if (!confirmed) return;

    this.patientService.deletePatient(patient.UHID).subscribe({
      next: () => {
        this.toastr.success('Patient deleted successfully');

        this.loadPatients(); // reload
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message || 'Failed to delete patient'
        );
      }
    });
  }
}