import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../../core/services/employee';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      role: ['RECEPTIONIST', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
    '09:00-11:00',
    '11:00-13:00',
    '14:00-16:00',
    '16:00-18:00'
  ];

  isSubmitting = false;
  statusMessage = '';

  constructor() {
    this.updateRoleSpecificValidators();
    this.registerForm.get('role')?.valueChanges.subscribe(() => {
      this.updateRoleSpecificValidators();
    });
  }

  get isDoctor(): boolean {
    return this.registerForm.get('role')?.value === 'DOCTOR';
  }

  get needsQualification(): boolean {
    return ['DOCTOR', 'NURSE'].includes(this.registerForm.get('role')?.value || '');
  }

  get availabilitySlotsControl(): FormArray {
    return this.registerForm.get('availabilitySlots') as FormArray;
  }

  fieldHasError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
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
      return 'Please enter a valid 10-digit phone number.';
    }
    if (control.errors['min']) {
      return `Value must be at least ${control.errors['min'].min}.`;
    }
    if (control.errors['passwordMismatch']) {
      return 'Passwords do not match.';
    }

    return 'Please enter a valid value.';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.statusMessage = 'Please correct the highlighted fields before submitting.';
      return;
    }

    this.isSubmitting = true;
    this.statusMessage = 'Submitting your registration request...';

    const payload = this.buildPayload();

    this.employeeService.registerEmployee(payload).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.statusMessage = response?.message || 'Registration submitted successfully. Please wait for admin approval.';
        this.registerForm.reset({
          name: '',
          email: '',
          phone: '',
          department: '',
          designation: '',
          role: 'RECEPTIONIST',
          password: '',
          confirmPassword: '',
          medicalRegistrationNo: '',
          specialization: '',
          qualification: '',
          consultationFee: '',
          availabilitySlots: []
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        this.statusMessage = this.getRegistrationErrorMessage(error);
      }
    });
  }

  private getRegistrationErrorMessage(error: any): string {
    const status = error?.status;
    const backendMessage = error?.error?.message || error?.message || '';
    const validationErrors = error?.error?.errors;

    if (Array.isArray(validationErrors) && validationErrors.length > 0) {
      return validationErrors[0]?.msg || 'Invalid registration details';
    }

    if (status === 409) {
      return 'Employee already exists. Kindly login';
    }

    if (/already exists/i.test(backendMessage) || /duplicate/i.test(backendMessage)) {
      return 'Employee already exists. Kindly login';
    }

    return backendMessage || 'Registration failed. Please try again.';
  }

  private updateRoleSpecificValidators(): void {
    const role = this.registerForm.get('role')?.value || '';

    const medicalRegistrationNo = this.registerForm.get('medicalRegistrationNo');
    const specialization = this.registerForm.get('specialization');
    const qualification = this.registerForm.get('qualification');
    const consultationFee = this.registerForm.get('consultationFee');
    const availabilitySlots = this.registerForm.get('availabilitySlots');

    [medicalRegistrationNo, specialization, qualification, consultationFee, availabilitySlots].forEach((control) => {
      control?.clearValidators();
      control?.updateValueAndValidity();
    });

    this.availabilitySlotsControl.clear();

    if (role === 'DOCTOR') {
      medicalRegistrationNo?.setValidators([Validators.required, Validators.minLength(4)]);
      specialization?.setValidators([Validators.required, Validators.minLength(2)]);
      qualification?.setValidators([Validators.required]);
      consultationFee?.setValidators([Validators.required, Validators.min(1)]);
      availabilitySlots?.setValidators([Validators.required]);
    } else if (role === 'NURSE') {
      qualification?.setValidators([Validators.required]);
    }

    [medicalRegistrationNo, specialization, qualification, consultationFee, availabilitySlots].forEach((control) => {
      control?.updateValueAndValidity();
    });
  }

  private buildPayload() {
    const raw = this.registerForm.getRawValue();
    const qualification = this.parseList(raw.qualification);
    const availabilitySlots = this.availabilitySlotsControl.value ?? [];

    return {
      ...raw,
      qualification: qualification.length ? qualification : undefined,
      availabilitySlots: availabilitySlots.length ? availabilitySlots : undefined,
      consultationFee: raw.consultationFee ? Number(raw.consultationFee) : undefined
    };
  }

  toggleAvailabilitySlot(slot: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.availabilitySlotsControl.push(new FormControl(slot));
    } else {
      const index = this.availabilitySlotsControl.controls.findIndex((control) => control.value === slot);
      if (index >= 0) {
        this.availabilitySlotsControl.removeAt(index);
      }
    }

    this.availabilitySlotsControl.updateValueAndValidity();
  }

  isAvailabilitySlotSelected(slot: string): boolean {
    return this.availabilitySlotsControl.value?.includes(slot) ?? false;
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
}
