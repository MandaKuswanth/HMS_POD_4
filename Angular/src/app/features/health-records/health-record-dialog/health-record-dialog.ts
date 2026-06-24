import { ChangeDetectorRef, Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

import { ToastrService } from 'ngx-toastr';

import { AppointmentService } from '../../../core/services/appointment';
import { HealthRecordService } from '../../../core/services/health-record';

@Component({
  selector: 'app-health-record-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './health-record-dialog.html',
  styleUrl: './health-record-dialog.css'
})
export class HealthRecordDialog implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<HealthRecordDialog>);
  private readonly appointmentService = inject(AppointmentService);
  private readonly healthRecordService = inject(HealthRecordService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);

  appointments: any[] = [];

  formData = {
    appointmentId: '',
    patientId: '',
    doctorEmployeeId: '',
    symptoms: '',
    diagnosis: '',
    prescription: '',
    notes: ''
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    if (this.data?.mode === 'edit' && this.data?.record) {
      this.formData = {
        appointmentId: this.data.record.appointmentId || '',
        patientId: this.data.record.patientId || '',
        doctorEmployeeId: this.data.record.doctorEmployeeId || '',
        symptoms: this.data.record.symptoms || '',
        diagnosis: this.data.record.diagnosis || '',
        prescription: this.data.record.prescription || '',
        notes: this.data.record.notes || ''
      };
    }

    this.loadAppointments();
  }

  loadAppointments(): void {
  this.healthRecordService
    .getEligibleAppointments()
    .subscribe({
      next: (response: any) => {
        this.appointments = Array.isArray(response?.data)
          ? response.data
          : [];

        setTimeout(() => {
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.appointments = [];
        this.toastr.error('Failed to load eligible appointments');
      }
    });
}

  onAppointmentChange(): void {
    const selected = this.appointments.find(
      (appointment) =>
        appointment.appointmentId === this.formData.appointmentId
    );

    this.formData.patientId = selected?.patientId || '';
    this.formData.doctorEmployeeId = selected?.doctorEmployeeId || '';
  }

  save(): void {
    if (
      !this.formData.appointmentId ||
      !this.formData.patientId ||
      !this.formData.doctorEmployeeId ||
      !this.formData.symptoms ||
      !this.formData.diagnosis
    ) {
      this.toastr.warning('Please fill all required fields');
      return;
    }

    const request$ =
      this.data?.mode === 'edit'
        ? this.healthRecordService.updateHealthRecord(
          this.data.record.healthRecordId,
          this.formData
        )
        : this.healthRecordService.createHealthRecord(this.formData);

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
        this.toastr.error(
          err?.error?.message || 'Failed to save health record'
        );
      }
    });
  }
}