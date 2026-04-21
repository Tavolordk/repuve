import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';

export type AccessFeedbackModalVariant = 'success' | 'error';

@Component({
    selector: 'app-access-feedback-modal',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './access-feedback-modal.html',
    styleUrl: './access-feedback-modal.scss'
})
export class AccessFeedbackModalComponent {
    protected readonly faEnvelope = faEnvelope;
    protected readonly faPhone = faPhone;
    protected readonly faCircleExclamation = faCircleExclamation;

    @Input() isOpen = false;
    @Input() variant: AccessFeedbackModalVariant = 'success';
    @Input() message = '';
    @Input() emailMasked = '';
    @Input() buttonText = 'Aceptar';
    @Input() showMailIcon = true;

    @Output() closed = new EventEmitter<void>();
    @Output() accepted = new EventEmitter<void>();

    onBackdropClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.close();
        }
    }

    close(): void {
        this.closed.emit();
    }

    accept(): void {
        this.accepted.emit();
    }

    get isSuccess(): boolean {
        return this.variant === 'success';
    }
}