import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee';
import { RoleService } from '../../../core/services/role';

export interface SelectableRole {
  roleId: string;
  name: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  today = new Date().toISOString().split('T')[0];

  readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      department: ['', Validators.required],
      designation: ['', Validators.required],

      joiningDate: ['', Validators.required],

      role: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      medicalRegistrationNo: [''],
      specialization: [''],
      qualification: [''],
      consultationFee: [''],
      availabilitySlots: this.fb.array<string>([])
    },
    {
      validators: this.passwordsMatchValidator()
    }
  );

  readonly availabilitySlotOptions = [
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
    '04:30 PM - 05:00 PM',
  ];

  isSubmitting = false;
  statusMessage = '';

  availableRoles: SelectableRole[] = [];
  rolesLoading = false;
  rolesLoadError = '';

  constructor() {
    this.registerForm.get('role')?.valueChanges.subscribe(() => {
      this.updateRoleSpecificValidators();
    });
  }

  ngOnInit(): void {
    this.loadSelectableRoles();
  }

  get isDoctor(): boolean {
    return this.registerForm.get('role')?.value === 'DOCTOR';
  }

  get needsQualification(): boolean {
    return ['DOCTOR', 'LAB_TECHNICIAN'].includes(
      this.registerForm.get('role')?.value || ''
    );
  }

  get availabilitySlotsControl(): FormArray {
    return this.registerForm.get('availabilitySlots') as FormArray;
  }

  fieldHasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  fieldErrorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (control.errors['minlength']) {
      return `Minimum ${control.errors['minlength'].requiredLength} characters required.`;
    }

    if (control.errors['pattern']) {
      return 'Please enter a valid value.';
    }

    if (control.errors['min']) {
      return `Value must be at least ${control.errors['min'].min}.`;
    }

    return 'Please enter a valid value.';
  }

  onSubmit(): void {
    if (this.registerForm.invalid || this.registerForm.errors?.['passwordMismatch']) {
      this.registerForm.markAllAsTouched();
      this.statusMessage =
        'Please correct the highlighted fields before submitting.';
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = 'Submitting your registration request...';

    const payload = this.buildPayload();

    this.employeeService.registerEmployee(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.statusMessage =
          response?.message ||
          'Registration submitted successfully. Please wait for admin approval.';

        this.registerForm.reset({
          name: '',
          email: '',
          phone: '',
          department: '',
          designation: '',
          joiningDate: '',
          role: '',
          password: '',
          confirmPassword: '',
          medicalRegistrationNo: '',
          specialization: '',
          qualification: '',
          consultationFee: '',
          availabilitySlots: [],
        });

        this.availabilitySlotsControl.clear();
      },
      error: (error) => {
        this.isSubmitting = false;
        this.statusMessage = this.getRegistrationErrorMessage(error);
      },
    });
  }

  toggleAvailabilitySlot(slot: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.availabilitySlotsControl.push(new FormControl(slot));
    } else {
      const index = this.availabilitySlotsControl.controls.findIndex(
        (control) => control.value === slot
      );

      if (index >= 0) {
        this.availabilitySlotsControl.removeAt(index);
      }
    }

    this.availabilitySlotsControl.markAsTouched();
    this.availabilitySlotsControl.updateValueAndValidity();
  }

  isAvailabilitySlotSelected(slot: string): boolean {
    return this.availabilitySlotsControl.value?.includes(slot) ?? false;
  }

  private loadSelectableRoles(): void {
    this.rolesLoading = true;
    this.rolesLoadError = '';

    // Public endpoint (no auth) — already filtered server-side to active,
    // non-restricted roles, so no client-side filtering is needed here.
    this.roleService.getPublicRegistrableRoles().subscribe({
      next: (response: any) => {
        const rawRoles: any[] = Array.isArray(response?.data)
          ? response.data
          : [];

        this.availableRoles = rawRoles.map((role) => ({
          roleId: role.roleId,
          name: role.name,
        }));

        this.rolesLoading = false;
      },
      error: () => {
        this.rolesLoading = false;
        this.rolesLoadError = 'Unable to load roles. Please refresh the page.';
      },
    });
  }

  private updateRoleSpecificValidators(): void {
    const role = this.registerForm.get('role')?.value || '';

    const medicalRegistrationNo = this.registerForm.get(
      'medicalRegistrationNo'
    );
    const specialization = this.registerForm.get('specialization');
    const qualification = this.registerForm.get('qualification');
    const consultationFee = this.registerForm.get('consultationFee');
    const availabilitySlots = this.registerForm.get('availabilitySlots');

    [
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
    ].forEach((control) => {
      control?.clearValidators();
      control?.updateValueAndValidity({ emitEvent: false });
    });

    this.availabilitySlotsControl.clear();

    if (role === 'DOCTOR') {
      medicalRegistrationNo?.setValidators([
        Validators.required,
        Validators.minLength(4),
      ]);

      specialization?.setValidators([
        Validators.required,
        Validators.minLength(2),
      ]);

      qualification?.setValidators([Validators.required]);

      consultationFee?.setValidators([
        Validators.required,
        Validators.min(1),
      ]);

      availabilitySlots?.setValidators([Validators.required]);
    } else if (role === 'LAB_TECHNICIAN') {
      qualification?.setValidators([Validators.required]);
    }

    [
      medicalRegistrationNo,
      specialization,
      qualification,
      consultationFee,
      availabilitySlots,
    ].forEach((control) => {
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private buildPayload() {
    const raw = this.registerForm.getRawValue();

    const parsedQualification = this.parseList(raw.qualification);
    const qualification = this.needsQualification && parsedQualification.length
      ? parsedQualification
      : undefined;

    const parsedAvailabilitySlots = this.availabilitySlotsControl.value ?? [];
    const availabilitySlots = this.isDoctor && parsedAvailabilitySlots.length
      ? parsedAvailabilitySlots
      : undefined;

    return {
      name: raw.name,
      phone: raw.phone,
      email: raw.email,
      role: raw.role,
      department: raw.department,
      designation: raw.designation,
      joiningDate: raw.joiningDate,

      password: raw.password,
      confirmPassword: raw.confirmPassword,

      medicalRegistrationNo: raw.medicalRegistrationNo || '',
      specialization: raw.specialization || '',
      qualification,
      consultationFee: raw.consultationFee
        ? Number(raw.consultationFee)
        : undefined,
      availabilitySlots,
    };
  }

  private parseList(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private passwordsMatchValidator() {
    return (form: any) => {
      const password = form.get('password')?.value;
      const confirmPassword = form.get('confirmPassword')?.value;

      return password && confirmPassword && password !== confirmPassword
        ? { passwordMismatch: true }
        : null;
    };
  }

  private getRegistrationErrorMessage(error: any): string {
    const status = error?.status;
    const backendMessage = error?.error?.message || error?.message || '';
    const validationErrors = error?.error?.errors;

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      return validationErrors[0]?.msg || 'Invalid registration details';
    }

    if (status === 409) {
      return 'Employee already exists. Kindly login.';
    }

    if (/already exists/i.test(backendMessage) || /duplicate/i.test(backendMessage)) {
      return 'Employee already exists. Kindly login.';
    }

    return backendMessage || 'Registration failed. Please try again.';
  }
}