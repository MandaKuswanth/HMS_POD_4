import { Component, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { EmployeeService } from '../../../core/services/employee';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})

export class Register {

  readonly fb = inject(FormBuilder);
  readonly employeeService = inject(EmployeeService);
  readonly toastr = inject(ToastrService);
  readonly router = inject(Router);
  readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  hidePassword = true;
  hideConfirm = true;

  roles = [
    'DOCTOR', 'RECEPTIONIST', 'CASHIER','NURSE', 'LAB_TECH', 'PHARMACIST', 'TECHNICIAN'
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    department: ['', Validators.required],
    designation: ['', Validators.required],
    joiningDate: ['', Validators.required],
    role: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
    medicalRegistrationNo: [''],
    specialization: [''],
    qualificationText: [''],
    consultationFee: [''],
    availabilitySlots: this.fb.array([])
  });

  get availabilitySlots(): FormArray {
    return this.form.get('availabilitySlots') as FormArray;
  }

  get selectedRole(): string {
    return this.form.get('role')?.value || '';
  }

  showMedicalStaffFields(): boolean {
    return ['DOCTOR', 'NURSE', 'LAB_TECH'].includes(this.selectedRole);
  }
  
  showDoctorFields(): boolean {
    return this.selectedRole === 'DOCTOR';
  }

  onRoleChange(): void {
    const qualCtrl = this.form.get('qualificationText');
    const feeCtrl = this.form.get('consultationFee');

    qualCtrl?.clearValidators();
    feeCtrl?.clearValidators();

    if (this.showMedicalStaffFields()) {
      qualCtrl?.setValidators([Validators.required]);
      if (this.availabilitySlots.length === 0) this.addSlot();
    } else {
      this.availabilitySlots.clear();
    }

    if (this.showDoctorFields()) {
      feeCtrl?.setValidators([Validators.required]);
    }

    qualCtrl?.updateValueAndValidity();
    feeCtrl?.updateValueAndValidity();
  }

  addSlot(): void {
    this.availabilitySlots.push(this.fb.control('', Validators.required));
  }

  removeSlot(index: number): void {
    this.availabilitySlots.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill all required fields');
      return;
    }

    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.toastr.error('Passwords do not match');
      return;
    }

    const formValue = this.form.value;

    const qualification = formValue.qualificationText
      ? formValue.qualificationText.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const joiningDate = formValue.joiningDate
      ? formatDate(formValue.joiningDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const payload: any = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      department: formValue.department,
      designation: formValue.designation,
      joiningDate,
      role: formValue.role,
      password: formValue.password,
      qualification: this.showMedicalStaffFields() ? qualification : [],
      availabilitySlots: this.showMedicalStaffFields()
        ? (formValue.availabilitySlots || [])
        : []
    };

    if (this.showDoctorFields()) {
      payload.medicalRegistrationNo = formValue.medicalRegistrationNo;
      payload.specialization = formValue.specialization;
      payload.consultationFee = Number(formValue.consultationFee);
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.employeeService.selfRegister(payload).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/login']).then(() => {
          this.toastr.success('Registration successful! Wait for admin approval.');
        });
      },
      error: (err) => {
        this.loading = false;
        this.cdr.markForCheck();
        this.toastr.error(err?.error?.message || 'Registration failed');
      }
    });
  }
}