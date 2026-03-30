import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-form-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './form-shell.html',
    styleUrl: './form-shell.css'
})
export class FormShellComponent {
    @Input() logoSrc = 'images/GOBMX.png';
    @Input() title = '';
    @Input() subtitle = '';
    @Input() currentStep = 1;
    @Input() totalSteps = 2;
}