import { Component, inject, OnInit } from '@angular/core';
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
import { ToastrService } from 'ngx-toastr';
import { AppointmentService } from '../../../core/services/appointment';
import { EmployeeService } from '../../../core/services/employee';
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
    MatIconModule
  ],
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.css'
})
export class AppointmentDialog implements OnInit {

  readonly fb = inject(FormBuilder);
  readonly toastr = inject(ToastrService);
  readonly dialogRef = inject(MatDialogRef<AppointmentDialog>);
  readonly appointmentService = inject(AppointmentService);
  readonly employeeService = inject(EmployeeService);
  readonly patientService = inject(PatientService);

  doctors: any[] = [];
  patients: any[] = [];
  availableSlots: string[] = [];
  loading = false;

  form = this.fb.group({
    patientId: ['', Validators.required],
    doctorEmployeeId: ['', Validators.required],
    date: ['', Validators.required],
    timeSlot: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadDoctors();
    this.loadPatients();
  }

  loadDoctors(): void {
    this.employeeService.getEmployees().subscribe({
      next: (response) => {
        const employees = response?.data?.employees || [];
        const users = response?.data?.user || [];

        this.doctors = employees.filter((emp: any) => {
          const user = users.find((u: any) => u.email === emp.email);
          return user?.roles?.toUpperCase() === 'DOCTOR' ||
            user?.role?.toUpperCase() === 'DOCTOR' ||
            emp.designation?.toUpperCase().includes('DOCTOR');
        });
      },
      error: () => {
        this.toastr.warning('Failed to load doctors');
      }
    });
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe({
      next: (response) => {
        this.patients = response?.data || [];
      }
    });
  }

  onDoctorChange(doctorCode: string): void {
    const selected = this.doctors.find(d => d.employeeCode === doctorCode);
    this.availableSlots = selected?.availabilitySlots || [];
    this.form.get('timeSlot')?.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    const payload = {
      patientId: formValue.patientId || '',
      doctorEmployeeId: formValue.doctorEmployeeId || '',
      date: formatDate(new Date(formValue.date || ''), 'yyyy-MM-dd', 'en-US'),
      timeSlot: formValue.timeSlot || ''
    };

    this.appointmentService.createAppointment(payload).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Appointment created');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err?.error?.message || 'Failed to create appointment');
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}