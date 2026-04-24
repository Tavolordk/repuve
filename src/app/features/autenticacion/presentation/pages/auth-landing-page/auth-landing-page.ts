import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';

@Component({
    selector: 'app-auth-landing',
    standalone: true,
    imports: [AuthShellComponent],
    templateUrl: './auth-landing-page.html',
    styleUrl: './auth-landing-page.scss'
})
export class AuthLandingPageComponent {
    constructor(private readonly router: Router) { }

    goToCrearCuenta(): void {
        this.router.navigate(['/crear-cuenta']);
    }

    goToGenerarContrasena(): void {
        this.router.navigate(['/generar-contrasena']);
    }
}