import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
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
import { EmployeeService } from '../../../core/services/employee';
import { PatientService } from '../../../core/services/patient';

interface AppointmentFormValue {
  patientId: string | null;
  doctorEmployeeId: string | null;
  date: Date | string | null;
  timeSlot: string | null;
}

@Component({
  selector: 'app-appointment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  // ✅ Signals — no more ExpressionChangedAfterChecked
  loading = signal(false);
  patientsLoading = signal(false);
  doctorsLoading = signal(false);

  form = this.fb.group({
    patientId: [null as string | null, Validators.required],
    doctorEmployeeId: [null as string | null, Validators.required],
    date: [null as Date | string | null, Validators.required],
    timeSlot: [{ value: null as string | null, disabled: true }, Validators.required]
  });

  ngOnInit(): void {
    this.loadPatients();
    this.loadDoctors();

    this.form.get('doctorEmployeeId')?.valueChanges.subscribe((doctorCode) => {
      this.onDoctorChange(doctorCode || '');
    });
  }

  loadPatients(): void {
    this.patientsLoading.set(true);
    this.patientService.getPatients().subscribe({
      next: (response: any) => {
        // ✅ Fixed: API returns { data: [...] } not { data: { patients: [...] } }
        this.patients = Array.isArray(response?.data) ? response.data : [];
        this.patientsLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.patients = [];
        this.patientsLoading.set(false);
        this.toastr.error(err?.error?.message || 'Failed to load patients');
        this.cdr.markForCheck();
      }
    });
  }

  loadDoctors(): void {
    this.doctorsLoading.set(true);
    this.employeeService.getEmployees().subscribe({
      next: (response: any) => {
        const employees = Array.isArray(response?.data) ? response.data : [];
        this.doctors = employees.filter((emp: any) => {
          const isDoc = Array.isArray(emp.roles)
            ? emp.roles.includes('DOCTOR')
            : emp.role === 'DOCTOR';
          return isDoc && emp.status === true;
        });
        this.doctorsLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.doctors = [];
        this.doctorsLoading.set(false);
        this.toastr.error(err?.error?.message || 'Failed to load doctors');
        this.cdr.markForCheck();
      }
    });
  }

  onDoctorChange(doctorCode: string): void {
    const slotControl = this.form.get('timeSlot');
    const selectedDoctor = this.doctors.find((d: any) => d.employeeCode === doctorCode);

    this.availableSlots = Array.isArray(selectedDoctor?.availabilitySlots)
      ? selectedDoctor.availabilitySlots
      : [];
    slotControl?.reset();

    if (this.availableSlots.length > 0) {
      slotControl?.enable();
    } else {
      slotControl?.disable();
    }
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill all required fields');
      return;
    }

    this.loading.set(true);
    const formValue = this.form.getRawValue() as AppointmentFormValue;

    const payload = {
      patientId: formValue.patientId || '',
      doctorEmployeeId: formValue.doctorEmployeeId || '',
      date: formValue.date
        ? formatDate(new Date(formValue.date), 'yyyy-MM-dd', 'en-US')
        : '',
      timeSlot: formValue.timeSlot || ''
    };

    this.appointmentService.createStaffAppointment(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastr.success('Appointment created successfully');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toastr.error(err?.error?.message || 'Failed to create appointment');
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}