import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { HealthRecord, HealthRecordService } from '../../../core/services/health-record';
import { PatientService, PatientRequest } from '../../../core/services/patient';
import { ToastService } from '../../../shared/services/toast.service';

export interface HealthRecordDialogData {
  mode: 'add' | 'edit' | 'view';
  record?: HealthRecord;
}

@Component({
  selector: 'app-health-record-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
  ],
  templateUrl: './health-record-dialog.html',
  styleUrl: './health-record-dialog.scss',
})
export class HealthRecordDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<HealthRecordDialog>);
  readonly data = inject<HealthRecordDialogData>(MAT_DIALOG_DATA);
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly patientService = inject(PatientService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly isViewMode = this.data.mode === 'view';

  patientSearch = new FormControl({ value: '', disabled: this.isViewMode });
  filteredPatients: PatientRequest[] = [];
  patientsLoading = signal(false);
  loading = signal(false);

  form = this.fb.group({
    patientId: [{ value: '', disabled: this.isViewMode }, Validators.required],
    appointmentId: [{ value: '', disabled: this.isViewMode }],
    symptoms: [{ value: '', disabled: this.isViewMode }, Validators.required],
    diagnosis: [{ value: '', disabled: this.isViewMode }, Validators.required],
    prescriptionName: [{ value: '', disabled: this.isViewMode }],
    prescriptionDosage: [{ value: '', disabled: this.isViewMode }],
    prescriptionDuration: [{ value: '', disabled: this.isViewMode }],
    notes: [{ value: '', disabled: this.isViewMode }],
  });

  get title(): string {
    if (this.data.mode === 'add') return 'Add Health Record';
    if (this.data.mode === 'edit') return 'Edit Health Record';
    return 'Health Record Details';
  }

  ngOnInit(): void {
    if (this.data.record) {
      this.patchRecord(this.data.record);
    }

    if (!this.isViewMode) {
      this.patientSearch.valueChanges.pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(term => {
          const query = typeof term === 'string' ? term.trim() : '';
          if (!query) {
            this.filteredPatients = [];
            this.cdr.markForCheck();
            return of([]);
          }
          this.patientsLoading.set(true);
          return this.patientService.getPatients({ search: query, limit: 15 });
        }),
      ).subscribe({
        next: (res: any) => {
          this.filteredPatients = res?.data || [];
          this.patientsLoading.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.filteredPatients = [];
          this.patientsLoading.set(false);
          this.cdr.markForCheck();
        },
      });
    }
  }

  private patchRecord(record: HealthRecord): void {
    this.form.patchValue({
      patientId: record.patientId,
      appointmentId: record.appointmentId || '',
      symptoms: record.symptoms,
      diagnosis: record.diagnosis,
      prescriptionName: record.prescriptionItems?.name || '',
      prescriptionDosage: record.prescriptionItems?.dosage || '',
      prescriptionDuration: record.prescriptionItems?.duration || '',
      notes: record.notes || '',
    });
    this.patientSearch.setValue(record.patientId, { emitEvent: false });
  }

  onPatientSelected(patient: PatientRequest): void {
    this.form.patchValue({ patientId: patient.UHID || '' });
    this.patientSearch.setValue(`${patient.name} (${patient.UHID})`, { emitEvent: false });
  }

  clearPatient(): void {
    this.form.patchValue({ patientId: '' });
    this.patientSearch.setValue('');
    this.filteredPatients = [];
  }

  onSubmit(): void {
    if (this.isViewMode) {
      this.dialogRef.close(false);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please complete all required fields');
      return;
    }

    this.loading.set(true);
    const v = this.form.getRawValue();

    const payload: Partial<HealthRecord> = {
      patientId: v.patientId || '',
      appointmentId: v.appointmentId || undefined,
      symptoms: v.symptoms || '',
      diagnosis: v.diagnosis || '',
      notes: v.notes || undefined,
    };

    if (v.prescriptionName) {
      payload.prescriptionItems = {
        name: v.prescriptionName,
        dosage: v.prescriptionDosage || undefined,
        duration: v.prescriptionDuration || undefined,
      };
    }

    const request$ = this.data.mode === 'edit' && this.data.record?._id
      ? this.healthRecordService.updateRecord(this.data.record._id, payload)
      : this.healthRecordService.createRecord(payload);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(
          this.data.mode === 'edit'
            ? 'Health record updated successfully'
            : 'Health record created successfully'
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message || 'Failed to save health record');
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
