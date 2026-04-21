import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-blocked-account-modal',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './blocked-account-modal.html',
    styleUrl: './blocked-account-modal.scss'
})
export class BlockedAccountModalComponent {
    protected readonly faLock = faLock;

    @Input() isOpen = false;
    @Input() title = 'Cuenta bloqueada';
    @Input() message = 'Tu cuenta ha sido bloqueada. Puedes solicitar la activación para recuperar el acceso.';
    @Input() cancelText = 'Cancelar';
    @Input() confirmText = 'Activar cuenta';
    @Input() loading = false;

    @Output() cancelled = new EventEmitter<void>();
    @Output() activateRequested = new EventEmitter<void>();

    onBackdropClick(_event: MouseEvent): void {
        // Intencionalmente no cerramos por click en el fondo.
        // El cierre sólo ocurre con los botones.
    }

    cancel(): void {
        if (this.loading) return;
        this.cancelled.emit();
    }

    activate(): void {
        if (this.loading) return;
        this.activateRequested.emit();
    }
}