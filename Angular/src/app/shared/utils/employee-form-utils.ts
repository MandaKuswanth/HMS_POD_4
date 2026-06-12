// src/app/shared/utils/employee-form-utils.ts

import {
    AbstractControl,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';

import { formatDate } from '@angular/common';

export function getQualifications(value: unknown): string[] {
    return typeof value === 'string'
        ? value
            .split(',')
            .map((qualification: string) => qualification.trim())
            .filter(Boolean)
        : [];
}

export function getFormattedJoiningDate(value: unknown): string {
    return value ? formatDate(value as string | number | Date, 'yyyy-MM-dd', 'en-US') : '';
}

export function getCleanAvailabilitySlots(
    value: unknown,
    shouldIncludeSlots: boolean
): string[] {
    if (!shouldIncludeSlots || !Array.isArray(value)) {
        return [];
    }

    return value
        .map((slot: unknown) => String(slot).trim())
        .filter(Boolean);
}

export function addDoctorPayloadFields(
    payload: any,
    formValue: any,
    shouldAddDoctorFields: boolean
): void {
    if (!shouldAddDoctorFields) {
        return;
    }

    payload.medicalRegistrationNo = trimInputValue(
        formValue.medicalRegistrationNo
    );

    payload.specialization = trimInputValue(
        formValue.specialization
    );

    payload.consultationFee = Number(formValue.consultationFee);
}

export const EMPLOYEE_ROLES = [
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

export const REGISTER_ROLES = [
    'DOCTOR',
    'RECEPTIONIST',
    'CASHIER',
    'NURSE',
    'LAB_TECH',
    'PHARMACIST',
    'TECHNICIAN'
];


export const MEDICAL_STAFF_ROLES = ['DOCTOR', 'NURSE', 'LAB_TECH'];

export const NAME_PATTERN = /^[A-Za-z ]+$/;
export const PHONE_PATTERN = /^[6-9]\d{9}$/;
export const MEDICAL_REGISTRATION_PATTERN = /^[A-Za-z\d/-]+$/;
export const CONSULTATION_FEE_PATTERN = /^\d+$/;    

export function isDoctorRole(role: string): boolean {
    return role === 'DOCTOR';
}

export function isMedicalStaffRole(role: string): boolean {
    return MEDICAL_STAFF_ROLES.includes(role);
}

export function trimInputValue(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

export function noFutureDateValidator(control: any) {

  if (!control.value) {
    return null;
  }

  const selectedDate = new Date(control.value);
  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate < today
    ? { pastDate: true }
    : null;
}

export function passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const passwordValue = control.value;

        if (!passwordValue) {
            return null;
        }

        const hasUpperCase = /[A-Z]/.test(passwordValue);
        const hasLowerCase = /[a-z]/.test(passwordValue);
        const hasNumber = /\d/.test(passwordValue);
        const hasSpecialCharacter =
            /[@$!%*?&#^()_+\-={}[\]|:;"'<>,./]/.test(passwordValue);

        const isStrongPassword =
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialCharacter;

        return isStrongPassword ? null : { weakPassword: true };
    };
}

export function passwordMatchValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;

        if (!password || !confirmPassword) {
            return null;
        }

        return password === confirmPassword ? null : { passwordMismatch: true };
    };
}

export function getMedicalRegistrationValidators() {
    return [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(MEDICAL_REGISTRATION_PATTERN)
    ];
}

export function getSpecializationValidators() {
    return [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN)
    ];
}

export function getConsultationFeeValidators() {
    return [
        Validators.required,
        Validators.min(1),
        Validators.pattern(CONSULTATION_FEE_PATTERN)
    ];
}

export function getQualificationValidators() {
    return [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
    ];
}