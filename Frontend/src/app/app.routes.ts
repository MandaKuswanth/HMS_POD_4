import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';


export const routes: Routes = [

    {
        path: '',
        loadComponent: () =>
            import('./features/landing/landing/landing').then(m => m.Landing)
    },
    {
        path: 'patients',
        loadComponent: () =>
            import('./features/patient/patient-list/patient-list').then(m => m.PatientList)
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login').then(m => m.Login)
    },
    {
        path: 'register',  
        loadComponent: () =>
            import('./features/auth/register/register').then(m => m.Register)
    },
    {
        path: 'reset-password',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword)
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'employees',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/employee/employee-list/employee-list').then(m => m.EmployeeList)
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./features/profile/profile/profile')
                .then(m => m.Profile)
    },
    {
        path: 'account-inactive',

        loadComponent: () =>
            import(
                './features/auth/account-inactive/account-inactive'
            ).then(c => c.AccountInactive)
    }, {
        path: 'appointments',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/appointments/appointment-list/appointment-list').then(m => m.AppointmentList)
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
