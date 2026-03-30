import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormShellComponent } from '../../../../../shared/layouts/form-shell/form-shell';

@Component({
    selector: 'app-paso-dos',
    standalone: true,
    imports: [CommonModule, FormsModule, FormShellComponent],
    templateUrl: './paso-dos.html',
    styleUrl: './paso-dos.scss'
})
export class PasoDosComponent {
    model = {
        institucion: '',
        cargo: '',
        entidad: '',
        domicilio: ''
    };

    back(): void {
        console.log('Volver al paso uno');
    }

    finish(): void {
        console.log('Paso 2 payload', this.model);
    }
}