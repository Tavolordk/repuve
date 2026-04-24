import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        // Pantalla principal que ofrece las dos opciones de acceso:
        // crear una cuenta nueva o generar contraseña para un usuario existente.
        path: 'inicio',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/auth-landing-page/auth-landing-page')
                .then(m => m.AuthLandingPageComponent)
    },
    {
        // Flujo de creación de una cuenta nueva.
        path: 'crear-cuenta',
        data: { flowMode: 'crear-cuenta' },
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/login-page/login-page')
                .then(m => m.LoginComponent)
    },
    {
        // Flujo de generación de contraseña para un usuario existente.
        path: 'generar-contrasena',
        data: { flowMode: 'generar-contrasena' },
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/login-page/login-page')
                .then(m => m.LoginComponent)
    },
    {
        // Alias de compatibilidad: /login redirige al landing.
        path: 'login',
        redirectTo: 'inicio',
        pathMatch: 'full'
    },
    {
        path: 'activar-cuenta',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/account-activation-page/account-activation-page')
                .then(m => m.AccountActivationPageComponent)
    },
    {
        path: 'cuenta-bloqueada',
        loadComponent: () =>
            import('./features/autenticacion/presentation/pages/blocked-activation-page/blocked-activation-page')
                .then(m => m.BlockedActivationPageComponent)
    },
    {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'inicio'
    }
];