import {
  Component,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators
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

import {
  REGISTER_ROLES,
  NAME_PATTERN,
  PHONE_PATTERN,
  SLOT_PATTERN,
  getConsultationFeeValidators,
  getMedicalRegistrationValidators,
  getQualificationValidators,
  getSpecializationValidators,
  isDoctorRole,
  isMedicalStaffRole,
  noFutureDateValidator,
  passwordMatchValidator,
  passwordStrengthValidator,
  trimInputValue,
  getQualifications,
  getFormattedJoiningDate,
  getCleanAvailabilitySlots,
  addDoctorPayloadFields
} from '../../../shared/utils/employee-form-utils';

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
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(Employee);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  hidePassword = true;
  hideConfirm = true;

  today = new Date();
  maxJoiningDate: Date = new Date(
    this.today.getFullYear(),
    this.today.getMonth() + 2,
    this.today.getDate()
  );


  readonly roles = REGISTER_ROLES;

  form = this.fb.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(NAME_PATTERN)
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
          Validators.pattern(PHONE_PATTERN)
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
          noFutureDateValidator()
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
          passwordStrengthValidator()
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
      validators: [passwordMatchValidator()]
    }
  );

  get availabilitySlots(): FormArray {
    return this.form.get('availabilitySlots') as FormArray;
  }

  get selectedRole(): string {
    return this.form.get('role')?.value || '';
  }

  showDoctorFields(): boolean {
    return isDoctorRole(this.selectedRole);
  }

  showMedicalStaffFields(): boolean {
    return isMedicalStaffRole(this.selectedRole);
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
      qualificationControl?.setValidators(getQualificationValidators());

      if (this.availabilitySlots.length === 0) {
        this.addSlot();
      }
    } else {
      this.availabilitySlots.clear();
    }

    if (this.showDoctorFields()) {
      medicalRegistrationControl?.setValidators(
        getMedicalRegistrationValidators()
      );

      specializationControl?.setValidators(
        getSpecializationValidators()
      );

      consultationFeeControl?.setValidators(
        getConsultationFeeValidators()
      );
    }

    qualificationControl?.updateValueAndValidity();
    consultationFeeControl?.updateValueAndValidity();
    medicalRegistrationControl?.updateValueAndValidity();
    specializationControl?.updateValueAndValidity();

    this.form.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  addSlot(): void {
    this.availabilitySlots.push(
      this.fb.control('', [
        Validators.required,
        Validators.pattern(SLOT_PATTERN)
      ])
    );

    this.cdr.markForCheck();
  }

  removeSlot(index: number): void {
    this.availabilitySlots.removeAt(index);

    if (this.showMedicalStaffFields() && this.availabilitySlots.length === 0) {
      this.addSlot();
    }

    this.cdr.markForCheck();
  }

  onSubmit(): void {
    console.log('FORM INVALID:', this.form.invalid);
    console.log('FORM ERRORS:', this.form.errors);

    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);

      if (control?.invalid) {
        console.log('INVALID FIELD:', key, control.errors, control.value);
      }
    });

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.errors?.['passwordMismatch']) {
        this.toastr.error('Passwords do not match');
        return;
      }

      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    const registerPayload = this.buildRegisterPayload();

    console.log('REGISTER PAYLOAD:', registerPayload);

    this.loading = true;
    this.cdr.markForCheck();

    this.employeeService.selfRegister(registerPayload).subscribe({
      next: (response: any) => {
        console.log('REGISTER SUCCESS:', response);

        this.loading = false;
        this.cdr.markForCheck();

        this.router.navigate(['/login']).then(() => {
          this.toastr.success(
            'Registration successful! Wait for admin approval.'
          );
        });
      },

      error: (errorResponse: any) => {
        console.log('REGISTER API ERROR:', errorResponse);
        console.log('BACKEND ERROR BODY:', errorResponse?.error);

        this.loading = false;
        this.cdr.markForCheck();

        this.toastr.error(
          errorResponse?.error?.message || 'Registration failed'
        );
      }
    });
  }

  private buildRegisterPayload(): any {
    const formValue = this.form.value;
    const isMedicalStaff = this.showMedicalStaffFields();

    const registerPayload: any = {
      name: trimInputValue(formValue.name),
      email: trimInputValue(formValue.email),
      phone: trimInputValue(formValue.phone),
      department: trimInputValue(formValue.department),
      designation: trimInputValue(formValue.designation),
      joiningDate: getFormattedJoiningDate(formValue.joiningDate),
      role: formValue.role,

      password: formValue.password,
      confirmPassword: formValue.confirmPassword,

      qualification: isMedicalStaff
        ? getQualifications(formValue.qualificationText)
        : [],

      availabilitySlots: getCleanAvailabilitySlots(
        formValue.availabilitySlots,
        isMedicalStaff
      )
    };

    addDoctorPayloadFields(
      registerPayload,
      formValue,
      this.showDoctorFields()
    );

    return registerPayload;
  }
}