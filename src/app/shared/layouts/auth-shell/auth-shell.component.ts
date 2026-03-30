import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-auth-shell',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './auth-shell.component.html',
    styleUrl: './auth-shell.component.css'
})
export class AuthShellComponent {
    @Input() logoSrc = 'images/GOBMX.png';
    @Input() title = '';
    @Input() subtitle = '';
}