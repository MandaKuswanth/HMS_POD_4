import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ToastrService } from 'ngx-toastr';

import { AppointmentService } from '../../../core/services/appointment';
import { EmployeeService} from '../../../core/services/employee';
import { PatientService } from '../../../core/services/patient';

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.css'
})
export class AppointmentDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly dialogRef = inject(MatDialogRef<AppointmentDialog>);
  private readonly appointmentService = inject(AppointmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  doctors: any[] = [];
  patients: any[] = [];
  availableSlots: string[] = [];

  minDate: Date = new Date(new Date().setDate(new Date().getDate() + 1));

  loading = false;
  patientsLoading = false;
  doctorsLoading = false;

  form = this.fb.group({
    patientId: ['', Validators.required],
    doctorEmployeeId: ['', Validators.required],
    date: ['', Validators.required],
    timeSlot: [{ value: '', disabled: true }, Validators.required]
  });

  ngOnInit(): void {
    this.loadPatients();
    this.loadDoctors();

    this.form.get('doctorEmployeeId')?.valueChanges.subscribe((doctorCode) => {
      this.onDoctorChange(doctorCode || '');
    });
  }

  loadPatients(): void {
    this.patientsLoading = true;

    this.patientService.getPatients().subscribe({
      next: (response: any) => {
        this.patients = Array.isArray(response?.data?.patients)
          ? response.data.patients
          : [];

        this.patientsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.patients = [];
        this.patientsLoading = false;
        this.toastr.error(err?.error?.message || 'Failed to load patients');
        this.cdr.detectChanges();
      }
    });
  }

  loadDoctors(): void {
    this.doctorsLoading = true;

    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        const employees = Array.isArray(response?.data)
          ? response.data
          : [];

        this.doctors = employees.filter((emp: any) =>
          emp.role === 'DOCTOR' &&
          emp.status === true
        );

        this.doctorsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.doctors = [];
        this.doctorsLoading = false;
        this.toastr.error(err?.error?.message || 'Failed to load doctors');
        this.cdr.detectChanges();
      }
    });
  }

  onDoctorChange(doctorCode: string): void {
    const slotControl = this.form.get('timeSlot');

    const selectedDoctor = this.doctors.find((doctor: any) =>
      doctor.employeeCode === doctorCode
    );

    this.availableSlots = Array.isArray(selectedDoctor?.availabilitySlots)
      ? selectedDoctor.availabilitySlots
      : [];

    slotControl?.reset();

    if (this.availableSlots.length > 0) {
      slotControl?.enable();
    } else {
      slotControl?.disable();
    }

    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill all required fields');
      return;
    }

    this.loading = true;

    const formValue = this.form.getRawValue();

    const payload = {
      patientId: formValue.patientId || '',
      doctorEmployeeId: formValue.doctorEmployeeId || '',
      date: formatDate(
        new Date(formValue.date || ''),
        'yyyy-MM-dd',
        'en-US'
      ),
      timeSlot: formValue.timeSlot || ''
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Appointment created successfully');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading = false;
        this.toastr.error(err?.error?.message || 'Failed to create appointment');
        this.cdr.detectChanges();
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}