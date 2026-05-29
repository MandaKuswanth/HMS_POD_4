import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule, formatDate } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  ValidationErrors,
  AbstractControl
} from '@angular/forms';

import { Router, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';
import { Employee } from '../../../core/services/employee';

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
  readonly employeeService = inject(Employee);
  readonly toastr = inject(ToastrService);
  readonly router = inject(Router);
  readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  hidePassword = true;
  hideConfirm = true;

  roles = [
    'DOCTOR',
    'RECEPTIONIST',
    'CASHIER',
    'NURSE',
    'LAB_TECH',
    'PHARMACIST',
    'TECHNICIAN'
  ];

  form = this.fb.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[A-Za-z ]+$/)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(80)
        ]
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[6-9][0-9]{9}$/)
        ]
      ],

      department: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50)
        ]
      ],

      designation: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50)
        ]
      ],

      joiningDate: [
        '',
        [
          Validators.required,
          this.noFutureDateValidator()
        ]
      ],

      role: [
        '',
        [
          Validators.required
        ]
      ],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(30),
          this.passwordStrengthValidator()
        ]
      ],

      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ],

      medicalRegistrationNo: [''],
      specialization: [''],
      qualificationText: [''],
      consultationFee: [''],

      availabilitySlots: this.fb.array([])
    },
    {
      validators: [this.passwordMatchValidator()]
    }
  );

  get availabilitySlots(): FormArray {
    return this.form.get('availabilitySlots') as FormArray;
  }

  get selectedRole(): string {
    return this.form.get('role')?.value || '';
  }

  showDoctorFields(): boolean {
    return this.selectedRole === 'DOCTOR';
  }

  showMedicalStaffFields(): boolean {
    return ['DOCTOR', 'NURSE', 'LAB_TECH'].includes(this.selectedRole);
  }

  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const passwordValue = control.value;

      if (!passwordValue) return null;

      const hasUpperCase = /[A-Z]/.test(passwordValue);
      const hasLowerCase = /[a-z]/.test(passwordValue);
      const hasNumber = /[0-9]/.test(passwordValue);
      const hasSpecialCharacter = /[@$!%*?&#^()_+\-={}[\]|:;"'<>,./]/.test(passwordValue);

      const isStrongPassword =
        hasUpperCase &&
        hasLowerCase &&
        hasNumber &&
        hasSpecialCharacter;

      return isStrongPassword ? null : { weakPassword: true };
    };
  }

  passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirmPassword = group.get('confirmPassword')?.value;

      if (!password || !confirmPassword) return null;

      return password === confirmPassword
        ? null
        : { passwordMismatch: true };
    };
  }

  noFutureDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const selectedDate = control.value;

      if (!selectedDate) return null;

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const joiningDate = new Date(selectedDate);
      joiningDate.setHours(0, 0, 0, 0);

      return joiningDate > todayDate ? { futureDate: true } : null;
    };
  }

  onRoleChange(): void {
    const qualificationControl = this.form.get('qualificationText');
    const consultationFeeControl = this.form.get('consultationFee');
    const medicalRegistrationControl = this.form.get('medicalRegistrationNo');
    const specializationControl = this.form.get('specialization');

    qualificationControl?.clearValidators();
    consultationFeeControl?.clearValidators();
    medicalRegistrationControl?.clearValidators();
    specializationControl?.clearValidators();

    if (this.showMedicalStaffFields()) {
      qualificationControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]);

      if (this.availabilitySlots.length === 0) {
        this.addSlot();
      }
    } else {
      this.availabilitySlots.clear();
    }

    if (this.showDoctorFields()) {
      medicalRegistrationControl?.setValidators([
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(/^[A-Za-z0-9/-]+$/)
      ]);

      specializationControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[A-Za-z ]+$/)
      ]);

      consultationFeeControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.pattern(/^[0-9]+$/)
      ]);
    }

    qualificationControl?.updateValueAndValidity();
    consultationFeeControl?.updateValueAndValidity();
    medicalRegistrationControl?.updateValueAndValidity();
    specializationControl?.updateValueAndValidity();

    this.form.updateValueAndValidity();
  }

  addSlot(): void {
    const availabilitySlotControl = this.fb.control('', [
      Validators.required,
      Validators.pattern(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?-\s?([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      )
    ]);

    this.availabilitySlots.push(availabilitySlotControl);
  }

  removeSlot(index: number): void {
    this.availabilitySlots.removeAt(index);

    if (this.showMedicalStaffFields() && this.availabilitySlots.length === 0) {
      this.addSlot();
    }
  }

  trimInputValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.errors?.['passwordMismatch']) {
        this.toastr.error('Passwords do not match');
        return;
      }

      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    const formValue = this.form.value;

    const qualifications = formValue.qualificationText
      ? formValue.qualificationText
        .split(',')
        .map((qualification: string) => qualification.trim())
        .filter(Boolean)
      : [];

    const formattedJoiningDate = formValue.joiningDate
      ? formatDate(formValue.joiningDate, 'yyyy-MM-dd', 'en-US')
      : '';

    const cleanedAvailabilitySlots = this.showMedicalStaffFields()
      ? (formValue.availabilitySlots || [])
        .map((slot: unknown) => String(slot).trim())
        .filter(Boolean)
      : [];

    const registerPayload: any = {
      name: this.trimInputValue(formValue.name),
      email: this.trimInputValue(formValue.email),
      phone: this.trimInputValue(formValue.phone),
      department: this.trimInputValue(formValue.department),
      designation: this.trimInputValue(formValue.designation),
      joiningDate: formattedJoiningDate,
      role: formValue.role,
      password: formValue.password,

      qualification: this.showMedicalStaffFields()
        ? qualifications
        : [],

      availabilitySlots: cleanedAvailabilitySlots
    };

    if (this.showDoctorFields()) {
      registerPayload.medicalRegistrationNo = this.trimInputValue(
        formValue.medicalRegistrationNo
      );

      registerPayload.specialization = this.trimInputValue(
        formValue.specialization
      );

      registerPayload.consultationFee = Number(formValue.consultationFee);
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.employeeService.selfRegister(registerPayload).subscribe({
      next: () => {
        this.loading = false;
        this.cdr.markForCheck();

        this.router.navigate(['/login']).then(() => {
          this.toastr.success(
            'Registration successful! Wait for admin approval.'
          );
        });
      },

      error: (errorResponse) => {
        this.loading = false;
        this.cdr.markForCheck();

        this.toastr.error(
          errorResponse?.error?.message || 'Registration failed'
        );
      }
    });
  }
}