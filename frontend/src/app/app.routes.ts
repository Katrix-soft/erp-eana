import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // ============================================
    // RUTAS PÚBLICAS (Sin autenticación)
    // ============================================
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

    // ============================================
    // RUTAS PROTEGIDAS (Requieren autenticación)
    // ============================================
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
        children: [
            // ----------------------------------------
            // Dashboard Principal
            // ----------------------------------------
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },

            // ----------------------------------------
            // Módulo de Comunicaciones (VHF)
            // ----------------------------------------
            {
                path: 'comunicaciones',
                loadComponent: () => import('./features/equipos/equipos-list/equipos-list.component').then(m => m.EquiposListComponent)
            },

            // ----------------------------------------
            // Módulo de Navegación
            // ----------------------------------------
            {
                path: 'navegacion',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./features/navegacion/navegacion-list/navegacion-list.component').then(m => m.NavegacionListComponent)
                    },
                    {
                        path: 'vor-analysis',
                        loadComponent: () => import('./features/navegacion/vor-analysis/vor-analysis.component').then(m => m.VorAnalysisComponent)
                    }
                ]
            },

            // ----------------------------------------
            // Módulo de Vigilancia
            // ----------------------------------------
            {
                path: 'vigilancia',
                loadComponent: () => import('./features/vigilancia/vigilancia-list/vigilancia-list.component').then(m => m.VigilanciaListComponent)
            },

            // ----------------------------------------
            // Módulo de Energía
            // ----------------------------------------
            {
                path: 'energia',
                loadComponent: () => import('./features/energia/energia-list/energia-list.component').then(m => m.EnergiaListComponent)
            },

            // ----------------------------------------
            // Módulo de Checklists
            // ----------------------------------------
            {
                path: 'checklists',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./features/checklists/checklist-list/checklist-list.component').then(m => m.ChecklistListComponent)
                    },
                    {
                        path: 'new',
                        loadComponent: () => import('./features/checklists/checklist-form/checklist-form.component').then(m => m.ChecklistFormComponent),
                        data: { mode: 'create' }
                    },
                    {
                        path: ':id',
                        loadComponent: () => import('./features/checklists/checklist-form/checklist-form.component').then(m => m.ChecklistFormComponent),
                        data: { mode: 'view' }
                    },
                    {
                        path: ':id/edit',
                        loadComponent: () => import('./features/checklists/checklist-form/checklist-form.component').then(m => m.ChecklistFormComponent),
                        data: { mode: 'edit' }
                    },
                    {
                        path: ':id/mimic',
                        loadComponent: () => import('./features/checklists/checklist-mimic/checklist-mimic.component').then(m => m.ChecklistMimicComponent)
                    }
                ]
            },

            // ----------------------------------------
            // Módulo de Mantenimiento
            // ----------------------------------------
            {
                path: 'mantenimiento',
                loadChildren: () => import('./features/mantenimiento/mantenimiento.routes').then(m => m.MANTENIMIENTO_ROUTES)
            },

            // ----------------------------------------
            // Módulo de Comunicación (Foro y Chat)
            // ----------------------------------------
            {
                path: 'foro',
                loadComponent: () => import('./features/foro/foro.component').then(m => m.ForoComponent)
            },
            {
                path: 'chat',
                loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
            },

            // ----------------------------------------
            // Perfil y Configuración
            // ----------------------------------------
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
            },

            // ----------------------------------------
            // Panel de Administración (Solo ADMIN/CNS_NACIONAL)
            // ----------------------------------------
            {
                path: 'admin',
                canActivate: [authGuard],
                data: { roles: ['CNS_NACIONAL', 'ADMIN'] },
                children: [
                    {
                        path: 'users',
                        loadComponent: () => import('./features/admin/users/users-list.component').then(m => m.UsersListComponent)
                    },
                    {
                        path: 'aeropuertos',
                        loadComponent: () => import('./features/admin/aeropuertos/aeropuertos-list.component').then(m => m.AeropuertosListComponent)
                    },
                    {
                        path: 'firs',
                        loadComponent: () => import('./features/admin/firs/fir-list.component').then(m => m.FirListComponent)
                    },
                    {
                        path: 'personal',
                        loadComponent: () => import('./features/admin/personal/personal-list.component').then(m => m.PersonalListComponent)
                    },
                    {
                        path: 'puestos',
                        loadComponent: () => import('./features/admin/puestos/puestos-list.component').then(m => m.PuestosListComponent)
                    },
                    {
                        path: 'comunicaciones',
                        loadComponent: () => import('./features/admin/comunicaciones/comunicaciones-list.component').then(m => m.ComunicacionesListComponent)
                    },
                    {
                        path: 'navegacion',
                        loadComponent: () => import('./features/admin/navegacion/navegacion-list.component').then(m => m.NavegacionListComponent)
                    },
                    {
                        path: 'vigilancia',
                        loadComponent: () => import('./features/admin/vigilancia/vigilancia-list.component').then(m => m.VigilanciaListComponent)
                    },
                    {
                        path: 'energia',
                        loadComponent: () => import('./features/admin/energia/energia-list.component').then(m => m.EnergiaListComponent)
                    },
                    {
                        path: 'vhf-importer',
                        loadComponent: () => import('./features/admin/vhf-importer/vhf-importer.component').then(m => m.VhfImporterComponent)
                    },
                    {
                        path: 'audit',
                        loadComponent: () => import('./features/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
                    },
                    {
                        path: '',
                        redirectTo: 'users',
                        pathMatch: 'full'
                    }
                ]
            },

            // ----------------------------------------
            // Redirección por defecto
            // ----------------------------------------
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            }
        ]
    },

    // ============================================
    // Ruta 404 - Redirección a login
    // ============================================
    {
        path: '**',
        redirectTo: 'login'
    }
];
