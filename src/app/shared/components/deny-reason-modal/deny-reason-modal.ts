import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-deny-reason-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './deny-reason-modal.html',
    styleUrl: './deny-reason-modal.scss'
})
export class DenyReasonModalComponent {
    protected readonly faTriangleExclamation = faTriangleExclamation;

    @Input() isOpen = false;
    @Input() loading = false;
    @Input() title = 'Motivo de denegación';
    @Input() description = 'Por favor, describe el motivo por el que se deniega la reactivación de la cuenta.';
    @Input() minLength = 10;
    @Input() maxLength = 500;

    @Output() cancelled = new EventEmitter<void>();
    @Output() confirmed = new EventEmitter<string>();

    motivo = '';
    touched = false;

    get trimmed(): string {
        return this.motivo.trim();
    }

    get isValid(): boolean {
        return this.trimmed.length >= this.minLength;
    }

    get showError(): boolean {
        return this.touched && !this.isValid;
    }

    onBackdropClick(_event: MouseEvent): void {
        // Intencionalmente no cerramos por click en el fondo.
    }

    cancel(): void {
        if (this.loading) return;
        this.motivo = '';
        this.touched = false;
        this.cancelled.emit();
    }

    confirm(): void {
        if (this.loading) return;
        this.touched = true;
        if (!this.isValid) return;
        this.confirmed.emit(this.trimmed);
    }

    reset(): void {
        this.motivo = '';
        this.touched = false;
    }
}