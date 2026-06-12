import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [

    {
        path: '',
        loadComponent: () =>
            import('./features/landing/landing').then((m) => m.Landing),
    },
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login').then((m) => m.Login),
    },
    {
        path: 'register',
        loadComponent: () =>
            import('./features/auth/register/register').then((m) => m.Register),
    },
    {
        path: 'reset-password',
        loadComponent: () =>
            import('./features/auth/reset-password/reset-password').then(
                (m) => m.ResetPassword
            ),
        canActivate: [authGuard],
    },
    {
        path: 'account-inactive',
        loadComponent: () =>
            import('./features/auth/account-inactive/account-inactive').then(
                (m) => m.AccountInactive
            ),
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [authGuard],
    },
    {
        path: 'employees',
        loadComponent: () =>
            import('./features/employee/employee-list/employee-list').then(
                (m) => m.EmployeeList
            ),
        canActivate: [authGuard],
    },
    {
        path: 'patients',
        loadComponent: () =>
            import('./features/patient/patient-list/patient-list').then(
                (m) => m.PatientList
            ),
        canActivate: [authGuard],
    },
    {
        path: 'appointments',
        loadComponent: () =>
            import(
                './features/appointments/appointment-list/appointment-list'
            ).then((m) => m.AppointmentList),
        canActivate: [authGuard],
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./features/profile/profile').then((m) => m.Profile),
        canActivate: [authGuard],
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },
];

