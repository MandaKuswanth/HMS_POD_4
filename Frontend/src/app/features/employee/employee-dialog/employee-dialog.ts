import { Component, inject, OnInit } from '@angular/core';
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

import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { ToastrService } from 'ngx-toastr';
import { Employee } from '../../../core/services/employee';

export interface EmployeeData {
  _id?: string;
  employeeCode?: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate?: string;
  role: string;
  status: boolean;
  medicalRegistrationNo?: string | null;
  specialization?: string | null;
  qualification?: string[];
  consultationFee?: number | null;
  availabilitySlots?: string[];
  userId?: string;
  userStatus?: boolean;
  mustResetPassword?: boolean;
}

export interface EmployeeDialogData {
  mode: 'add' | 'edit';
  employee?: EmployeeData;
}

@Component({
  selector: 'app-employee-dialog',
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
  templateUrl: './employee-dialog.html',
  styleUrl: './employee-dialog.css'
})
export class EmployeeDialog implements OnInit {
  readonly fb = inject(FormBuilder);
  readonly employeeService = inject(Employee);
  readonly toastr = inject(ToastrService);
  readonly dialogRef = inject(MatDialogRef<EmployeeDialog>);
  readonly data = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  loading = false;

  roles = [
    'OWNER',
    'ADMIN',
    'DOCTOR',
    'RECEPTIONIST',
    'CASHIER',
    'NURSE',
    'LAB_TECH',
    'PHARMACIST',
    'TECHNICIAN'
  ];

  form = this.fb.group({
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
        this.noFutureDateValidator()
      ]
    ],

    role: [
      '',
      [
        Validators.required
      ]
    ],

    status: [true],

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

  showDoctorFields(): boolean {
    return this.selectedRole === 'DOCTOR';
  }

  showMedicalStaffFields(): boolean {
    return ['DOCTOR', 'NURSE', 'LAB_TECH'].includes(this.selectedRole);
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.employee) {
      const employee = this.data.employee;

      this.form.patchValue({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        designation: employee.designation || '',
        joiningDate: employee.joiningDate || '',
        role: employee.role || '',
        status: employee.status ?? true,
        medicalRegistrationNo: employee.medicalRegistrationNo || '',
        specialization: employee.specialization || '',
        qualificationText: employee.qualification?.join(', ') || '',
        consultationFee: employee.consultationFee
          ? String(employee.consultationFee)
          : ''
      });

      this.availabilitySlots.clear();

      if (employee.availabilitySlots?.length) {
        employee.availabilitySlots.forEach((slot: string) => {
          this.availabilitySlots.push(
            this.fb.control(slot, [
              Validators.required,
              Validators.pattern(
                /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?-\s?([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
              )
            ])
          );
        });
      }

      this.onRoleChange();
    }
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

    const employeePayload: any = {
      name: this.trimInputValue(formValue.name),
      email: this.trimInputValue(formValue.email),
      phone: this.trimInputValue(formValue.phone),
      department: this.trimInputValue(formValue.department),
      designation: this.trimInputValue(formValue.designation),
      joiningDate: formattedJoiningDate,
      role: formValue.role,
      status: formValue.status,
      qualification: this.showMedicalStaffFields()
        ? qualifications
        : []
    };

    if (this.showMedicalStaffFields()) {
      employeePayload.availabilitySlots = cleanedAvailabilitySlots;
    }

    if (this.showDoctorFields()) {
      employeePayload.medicalRegistrationNo = this.trimInputValue(
        formValue.medicalRegistrationNo
      );

      employeePayload.specialization = this.trimInputValue(
        formValue.specialization
      );

      employeePayload.consultationFee = Number(formValue.consultationFee);
    }

    this.loading = true;

    if (this.data.mode === 'add') {
      this.employeeService.adminAddEmployee(employeePayload).subscribe({
        next: (response: any) => {
          this.loading = false;

          const tempPassword = response?.data?.tempPassword;

          this.toastr.success(
            tempPassword
              ? `Employee created. Temp password: ${tempPassword}`
              : 'Employee created successfully'
          );

          this.dialogRef.close(true);
        },

        error: (errorResponse: any) => {
          this.loading = false;

          this.toastr.error(
            errorResponse?.error?.message || 'Failed to create employee'
          );
        }
      });

      return;
    }

    const employeeCode = this.data.employee?.employeeCode;

    if (!employeeCode) {
      this.loading = false;
      this.toastr.error('Employee code missing');
      return;
    }

    this.employeeService.updateEmployee(employeeCode, employeePayload).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Employee updated successfully');
        this.dialogRef.close(true);
      },

      error: (errorResponse: any) => {
        this.loading = false;

        this.toastr.error(
          errorResponse?.error?.message || 'Failed to update employee'
        );
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}