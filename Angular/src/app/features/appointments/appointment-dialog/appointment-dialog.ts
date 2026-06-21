import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { ToastService } from '../../../shared/services/toast.service';
import { AppointmentService } from '../../../core/services/appointment';
import { EmployeeService } from '../../../core/services/employee';
import { PatientService, PatientRequest } from '../../../core/services/patient';

interface DoctorOption {
  employeeCode: string;
  name: string;
  availabilitySlots?: string[];
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
    MatAutocompleteModule,
  ],
  templateUrl: './appointment-dialog.html',
  styleUrl: './appointment-dialog.scss',
})
export class AppointmentDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<AppointmentDialog>);
  private readonly appointmentService = inject(AppointmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly patientService = inject(PatientService);
  private readonly cdr = inject(ChangeDetectorRef);

  patientSearch = new FormControl('');
  doctorSearch = new FormControl('');

  filteredPatients: PatientRequest[] = [];
  filteredDoctors: DoctorOption[] = [];
  selectedDoctor: DoctorOption | null = null;
  availableSlots: string[] = [];

  minDate = new Date(new Date().setDate(new Date().getDate() + 1));

  loading = signal(false);
  patientsLoading = signal(false);
  doctorsLoading = signal(false);

  form = this.fb.group({
    patientId: ['', Validators.required],
    doctorEmployeeId: ['', Validators.required],
    date: [null as Date | null, Validators.required],
    timeSlot: [{ value: '', disabled: true }, Validators.required],
  });

  ngOnInit(): void {
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

    this.doctorSearch.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => {
        const query = typeof term === 'string' ? term.trim() : '';
        if (!query) {
          this.filteredDoctors = [];
          this.cdr.markForCheck();
          return of([]);
        }
        this.doctorsLoading.set(true);
        return this.employeeService.getEmployees({ search: query, limit: 15, role: 'DOCTOR', status: 'ACTIVE' });
      }),
    ).subscribe({
      next: (res: any) => {
        const employees = (res?.data || []) as any[];
        this.filteredDoctors = employees
          .filter(emp => {
            const roles = Array.isArray(emp.roles) ? emp.roles : [emp.role];
            return roles.includes('DOCTOR') && emp.status === true;
          })
          .map(emp => ({
            employeeCode: emp.employeeCode,
            name: emp.name,
            availabilitySlots: emp.availabilitySlots,
          }));
        this.doctorsLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.filteredDoctors = [];
        this.doctorsLoading.set(false);
        this.cdr.markForCheck();
      },
    });

    this.form.get('doctorEmployeeId')?.valueChanges.subscribe(code => {
      this.onDoctorChange(code || '');
    });
  }

  onPatientSelected(patient: PatientRequest): void {
    this.form.patchValue({ patientId: patient.UHID || '' });
    this.patientSearch.setValue(`${patient.name} (${patient.UHID})`, { emitEvent: false });
  }

  onDoctorSelected(doctor: DoctorOption): void {
    this.selectedDoctor = doctor;
    this.form.patchValue({ doctorEmployeeId: doctor.employeeCode });
    this.doctorSearch.setValue(`Dr. ${doctor.name} (${doctor.employeeCode})`, { emitEvent: false });
    this.updateSlots(doctor);
  }

  clearPatient(): void {
    this.form.patchValue({ patientId: '' });
    this.patientSearch.setValue('');
    this.filteredPatients = [];
  }

  clearDoctor(): void {
    this.selectedDoctor = null;
    this.form.patchValue({ doctorEmployeeId: '' });
    this.doctorSearch.setValue('');
    this.filteredDoctors = [];
    this.updateSlots(null);
  }

  private updateSlots(doctor: DoctorOption | null): void {
    const slotControl = this.form.get('timeSlot');
    this.availableSlots = Array.isArray(doctor?.availabilitySlots) ? doctor!.availabilitySlots! : [];
    slotControl?.reset();

    if (this.availableSlots.length > 0) {
      slotControl?.enable();
    } else {
      slotControl?.disable();
    }
    this.cdr.markForCheck();
  }

  onDoctorChange(doctorCode: string): void {
    if (!doctorCode) {
      this.updateSlots(null);
      return;
    }
    if (this.selectedDoctor?.employeeCode === doctorCode) {
      this.updateSlots(this.selectedDoctor);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.patientSearch.markAsTouched();
      this.doctorSearch.markAsTouched();
      this.toast.warning('Please complete all required fields');
      return;
    }

    this.loading.set(true);
    const formValue = this.form.getRawValue();

    const payload = {
      patientId: formValue.patientId || '',
      doctorEmployeeId: formValue.doctorEmployeeId || '',
      date: formValue.date
        ? formatDate(new Date(formValue.date), 'yyyy-MM-dd', 'en-US')
        : '',
      timeSlot: formValue.timeSlot || '',
    };

    this.appointmentService.createStaffAppointment(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Appointment created successfully');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message || 'Failed to create appointment');
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
