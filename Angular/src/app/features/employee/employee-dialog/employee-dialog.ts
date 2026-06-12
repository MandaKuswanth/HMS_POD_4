
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators
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
import { EmployeeService } from '../../../core/services/employee';
import {
  EMPLOYEE_ROLES,
  NAME_PATTERN,
  PHONE_PATTERN,
  getConsultationFeeValidators,
  getMedicalRegistrationValidators,
  getQualificationValidators,
  getSpecializationValidators,
  isDoctorRole,
  isMedicalStaffRole,
  noFutureDateValidator,
  trimInputValue,
  getQualifications,
  getFormattedJoiningDate,
  getCleanAvailabilitySlots,
  addDoctorPayloadFields
} from '../../../shared/utils/employee-form-utils';


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
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly toastr = inject(ToastrService);
  private readonly dialogRef = inject(MatDialogRef<EmployeeDialog>);

  readonly data = inject<EmployeeDialogData>(MAT_DIALOG_DATA);

  loading = false;
  readonly roles = EMPLOYEE_ROLES;
  timeSlots: string[] = [
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '12:00 PM - 12:30 PM',
  '12:30 PM - 01:00 PM',
  '01:00 PM - 01:30 PM',
  '01:30 PM - 02:00 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '03:30 PM - 04:00 PM',
  '04:00 PM - 04:30 PM',
  '04:30 PM - 05:00 PM'
];

  form = this.fb.group({
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
        noFutureDateValidator
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
    return isDoctorRole(this.selectedRole);
  }

  showMedicalStaffFields(): boolean {
    return isMedicalStaffRole(this.selectedRole);
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.employee) {
      this.patchEmployeeData(this.data.employee);
    }
  }

  private patchEmployeeData(employee: EmployeeData): void {
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
        this.availabilitySlots.push(this.fb.control(slot));
      });
    }

    this.onRoleChange();
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
  }


  toggleSlot(slot: string, event: any): void {

  if (event.target.checked) {

    this.availabilitySlots.push(
      this.fb.control(slot)
    );

  } else {

    const index = this.availabilitySlots.value.indexOf(slot);

    if (index > -1) {
      this.availabilitySlots.removeAt(index);
    }

  }
}



  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Please fill all required fields correctly');
      return;
    }

    const employeePayload = this.buildEmployeePayload();

    this.loading = true;

    if (this.data.mode === 'add') {
      this.createEmployee(employeePayload);
      return;
    }

    this.updateEmployee(employeePayload);
  }
  private buildEmployeePayload(): any {
    const formValue = this.form.value;
    const isMedicalStaff = this.showMedicalStaffFields();

    const employeePayload: any = {
      name: trimInputValue(formValue.name),
      email: trimInputValue(formValue.email),
      phone: trimInputValue(formValue.phone),
      department: trimInputValue(formValue.department),
      designation: trimInputValue(formValue.designation),
      joiningDate: getFormattedJoiningDate(formValue.joiningDate),
      role: formValue.role,
      status: formValue.status,
      qualification: isMedicalStaff
        ? getQualifications(formValue.qualificationText)
        : []
    };

    if (isMedicalStaff) {
      employeePayload.availabilitySlots = getCleanAvailabilitySlots(
        formValue.availabilitySlots,
        true
      );
    }

    addDoctorPayloadFields(
      employeePayload,
      formValue,
      this.showDoctorFields()
    );

    return employeePayload;
  }

  private createEmployee(employeePayload: any): void {
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
  }

  private updateEmployee(employeePayload: any): void {
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