import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-blocked-account-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './blocked-account-modal.html',
    styleUrl: './blocked-account-modal.scss'
})
export class BlockedAccountModalComponent {
    @Input() isOpen = false;
    @Input() message = 'Tu cuenta ha sido bloqueada. Puedes solicitar la activación para recuperar el acceso.';

    @Output() cancelled = new EventEmitter<void>();
    @Output() activateRequested = new EventEmitter<void>();

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.cancel();
        }
    }

    cancel(): void {
        this.cancelled.emit();
    }

    activate(): void {
        this.activateRequested.emit();
    }
}