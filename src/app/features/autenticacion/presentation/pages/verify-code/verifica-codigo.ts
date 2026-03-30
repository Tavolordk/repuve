import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';

@Component({
    selector: 'app-verifica-codigo',
    standalone: true,
    imports: [CommonModule, FormsModule, AuthShellComponent],
    templateUrl: './verifica-codigo.html',
    styleUrl: './verifica-codigo.css'
})
export class VerificaCodigoComponent {
    code = '';

    resendCode(): void {
        console.log('Reenviar codigo');
    }

    verify(): void {
        console.log('Codigo a verificar', this.code);
    }
}