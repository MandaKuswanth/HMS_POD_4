import { ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { HealthRecordService } from '../../../core/services/health-record';
import { SearchDropdownComponent } from '../../../shared/components/search-dropdown/search-dropdown';

@Component({
  selector: 'app-health-record-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    SearchDropdownComponent
  ],
  templateUrl: './health-record-dialog.html',
  styleUrl: './health-record-dialog.css'
})
export class HealthRecordDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<HealthRecordDialog>);
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly toastr = inject(ToastrService);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly data = inject<any>(MAT_DIALOG_DATA, { optional: true });

  loading = false;

  form = this.fb.group({
    appointmentId: ['', Validators.required],
    patientId: ['', Validators.required],
    doctorEmployeeId: ['', Validators.required],
    symptoms: ['', Validators.required],
    diagnosis: ['', Validators.required],
    prescription: [''],
    notes: ['']
  });

  ngOnInit(): void {
    if (this.data?.mode === 'edit' && this.data?.record) {
      const record = this.data.record;
      this.form.patchValue({
        appointmentId: record.appointmentId || '',
        patientId: record.patientId || '',
        doctorEmployeeId: record.doctorEmployeeId || '',
        symptoms: record.symptoms || '',
        diagnosis: record.diagnosis || '',
        prescription: record.prescription || '',
        notes: record.notes || ''
      });
      // In edit mode, disable appointment select
      this.form.get('appointmentId')?.disable();
    }
  }

  searchAppointments = (query: string): Observable<any> => {
    return this.http.get<any>(
      `http://localhost:3000/api/appointments/search?q=${query}&status=COMPLETED&limit=10`
    );
  };

  onAppointmentSelected(appointment: any): void {
    if (appointment) {
      this.form.patchValue({
        patientId: appointment.patientId || '',
        doctorEmployeeId: appointment.doctorEmployeeId || ''
      });
      this.cdr.detectChanges();
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Please fill all required fields');
      return;
    }

    this.loading = true;
    const formValue = this.form.getRawValue();
    const payload = {
      appointmentId: formValue.appointmentId || '',
      patientId: formValue.patientId || '',
      doctorEmployeeId: formValue.doctorEmployeeId || '',
      symptoms: formValue.symptoms || '',
      diagnosis: formValue.diagnosis || '',
      prescription: formValue.prescription || undefined,
      notes: formValue.notes || undefined
    };

    const request$ =
      this.data?.mode === 'edit'
        ? this.healthRecordService.updateHealthRecord(
            this.data.record.healthRecordId,
            payload
          )
        : this.healthRecordService.createHealthRecord(payload);

    request$.subscribe({
      next: () => {
        this.toastr.success(
          this.data?.mode === 'edit'
            ? 'Health record updated successfully'
            : 'Health record created successfully'
        );
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(
          err?.error?.message || 'Failed to save health record'
        );
        this.cdr.detectChanges();
      }
    });
  }
}