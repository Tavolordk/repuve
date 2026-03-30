import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormShellComponent } from '../../../../../shared/layouts/form-shell/form-shell';

@Component({
    selector: 'app-paso-uno',
    standalone: true,
    imports: [CommonModule, FormsModule, FormShellComponent],
    templateUrl: './paso-uno.html',
    styleUrl: './paso-uno.css'
})
export class PasoUnoComponent {
    model = {
        nombre: '',
        apellidos: '',
        curp: '',
        correo: '',
        telefono: ''
    };

    next(): void {
        console.log('Paso 1 payload', this.model);
    }
}