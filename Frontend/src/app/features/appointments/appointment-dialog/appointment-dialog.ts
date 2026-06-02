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

import { ToastrService } from 'ngx-toastr';

import { AppointmentService } from '../../../core/services/appointment';
import { Employee } from '../../../core/services/employee';
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
    private readonly fb = inject(FormBuilder);
    private readonly toastr = inject(ToastrService);
    private readonly dialogRef = inject(MatDialogRef<AppointmentDialog>);
    private readonly appointmentService = inject(AppointmentService);
    private readonly employeeService = inject(Employee);
    private readonly patientService = inject(PatientService);
    private readonly cdr = inject(ChangeDetectorRef);

    doctors: any[] = [];
    patients: any[] = [];
    availableSlots: string[] = [];
    minDate: Date = new Date();

    loading = false;

    form = this.fb.group({
        patientId: ['', Validators.required],
        doctorEmployeeId: ['', Validators.required],
        date: ['', Validators.required],
        timeSlot: ['', Validators.required]
    });

    ngOnInit(): void {
        this.loadPatients();
        this.loadDoctors();

        this.form.get('doctorEmployeeId')?.valueChanges.subscribe((doctorCode) => {
            this.onDoctorChange(doctorCode || '');
        });
    }

    loadPatients(): void {
        this.patientService.getPatients().subscribe({
            next: (response: any) => {
                console.log('PATIENT RESPONSE:', response);

                this.patients = Array.isArray(response?.data?.patients)
                    ? response.data.patients
                    : [];

                console.log('PATIENTS DROPDOWN:', this.patients);

                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error('PATIENT LOAD ERROR:', err);
                this.patients = [];
                this.toastr.error(err?.error?.message || 'Failed to load patients');
                this.cdr.detectChanges();
            }
        });
    }

    loadDoctors(): void {
        this.employeeService.getEmployees().subscribe({
            next: (response: any) => {
                console.log('EMPLOYEE RESPONSE:', response);

                const employees = Array.isArray(response?.data)
                    ? response.data
                    : [];

                this.doctors = employees.filter((emp: any) =>
                    emp.role === 'DOCTOR' &&
                    emp.status === true
                );

                console.log('DOCTORS DROPDOWN:', this.doctors);

                this.cdr.detectChanges();
            },
            error: (err: any) => {
                console.error('DOCTOR LOAD ERROR:', err);
                this.doctors = [];
                this.toastr.error(err?.error?.message || 'Failed to load doctors');
                this.cdr.detectChanges();
            }
        });
    }

    onDoctorChange(doctorCode: string): void {
        const selectedDoctor = this.doctors.find((doctor: any) =>
            doctor.employeeCode === doctorCode
        );

        this.availableSlots = Array.isArray(selectedDoctor?.availabilitySlots)
            ? selectedDoctor.availabilitySlots
            : [];

        this.form.get('timeSlot')?.reset();

        console.log('SELECTED DOCTOR:', selectedDoctor);
        console.log('AVAILABLE SLOTS:', this.availableSlots);

        this.cdr.detectChanges();
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.toastr.error('Please fill all required fields');
            return;
        }

        this.loading = true;

        const formValue = this.form.value;

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

        console.log('APPOINTMENT PAYLOAD:', payload);

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