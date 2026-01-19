import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'comunicaciones',
                loadComponent: () => import('./features/equipos/equipos-list/equipos-list.component').then(m => m.EquiposListComponent)
            },
            {
                path: 'checklists',
                loadComponent: () => import('./features/checklists/checklist-list/checklist-list.component').then(m => m.ChecklistListComponent)
            },
            {
                path: 'checklists/new',
                loadComponent: () => import('./features/checklists/checklist-form/checklist-form.component').then(m => m.ChecklistFormComponent),
                data: { mode: 'create' }
            },
            {
                path: 'checklists/:id',
                loadComponent: () => import('./features/checklists/checklist-form/checklist-form.component').then(m => m.ChecklistFormComponent),
                data: { mode: 'view' }
            },
            {
                path: 'checklists/:id/edit',
                loadComponent: () => import('./features/checklists/checklist-form/checklist-form.component').then(m => m.ChecklistFormComponent),
                data: { mode: 'edit' }
            },
            {
                path: 'checklists/:id/mimic',
                loadComponent: () => import('./features/checklists/checklist-mimic/checklist-mimic.component').then(m => m.ChecklistMimicComponent)
            },
            {
                path: 'admin/users',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/users/users-list.component').then(m => m.UsersListComponent)
            },
            {
                path: 'admin/aeropuertos',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/aeropuertos/aeropuertos-list.component').then(m => m.AeropuertosListComponent)
            },
            {
                path: 'admin/firs',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/firs/fir-list.component').then(m => m.FirListComponent)
            },
            {
                path: 'admin/personal',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/personal/personal-list.component').then(m => m.PersonalListComponent)
            },
            {
                path: 'admin/puestos',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/puestos/puestos-list.component').then(m => m.PuestosListComponent)
            },
            {
                path: 'admin/comunicaciones',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/comunicaciones/comunicaciones-list.component').then(m => m.ComunicacionesListComponent)
            },
            {
                path: 'admin/navegacion',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/navegacion/navegacion-list.component').then(m => m.NavegacionListComponent)
            },
            {
                path: 'admin/vigilancia',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/vigilancia/vigilancia-list.component').then(m => m.VigilanciaListComponent)
            },
            {
                path: 'admin/energia',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/energia/energia-list.component').then(m => m.EnergiaListComponent)
            },
            {
                path: 'admin/vhf-importer',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/vhf-importer/vhf-importer.component').then(m => m.VhfImporterComponent)
            },
            {
                path: 'admin/audit',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                loadComponent: () => import('./features/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
            },
            {
                path: 'settings',

                loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'mantenimiento',
                loadChildren: () => import('./features/mantenimiento/mantenimiento.routes').then(m => m.MANTENIMIENTO_ROUTES)
            },
            {
                path: 'navegacion',
                loadComponent: () => import('./features/navegacion/navegacion-list/navegacion-list.component').then(m => m.NavegacionListComponent)
            },
            {
                path: 'vigilancia',
                loadComponent: () => import('./features/vigilancia/vigilancia-list/vigilancia-list.component').then(m => m.VigilanciaListComponent)
            },
            {
                path: 'energia',
                loadComponent: () => import('./features/energia/energia-list/energia-list.component').then(m => m.EnergiaListComponent)
            },
            {
                path: 'foro',
                loadComponent: () => import('./features/foro/foro.component').then(m => m.ForoComponent)
            },
            {
                path: 'chat',
                loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
            },
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
