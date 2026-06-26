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
        path: '',
        loadComponent: () => import('./shared/layouts/main-layout/main-layout').then(m => m.MainLayout),
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
            },
            {
                path: 'employees',
                loadComponent: () => import('./features/employee/employee-list/employee-list').then((m) => m.EmployeeList),
            },
            {
                path: 'patients',
                loadComponent: () => import('./features/patient/patient-list/patient-list').then((m) => m.PatientList),
            },
            {
                path: 'appointments',
                loadComponent: () => import('./features/appointments/appointment-list/appointment-list').then((m) => m.AppointmentList),
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
            },
            {
                path: 'roles',
                loadComponent: () => import('./features/roles/role-list/role-list').then((m) => m.RoleList),
            },
            {
                path: 'nodes',
                loadComponent: () => import('./features/nodes/node-list/node-list').then((m) => m.NodeList),
            },
            {
                path: 'health-records',
                loadComponent: () => import('./features/health-records/health-record-list/health-record-list').then((m) => m.HealthRecordList),
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard',
    },

];

