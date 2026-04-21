import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/login-page/login-page')
                .then(m => m.LoginComponent)
    }, {
        path: 'activar-cuenta',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/account-activation-page/account-activation-page')
                .then(m => m.AccountActivationPageComponent)
    }, {
        path: 'cuenta-bloqueada',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/blocked-activation-page/blocked-activation-page')
                .then(m => m.BlockedActivationPageComponent)
    }, {
        path: 'admin/solicitudes-activacion',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/admin-activation-requests/admin-activation-requests')
                .then(m => m.AdminActivationRequestsComponent)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];