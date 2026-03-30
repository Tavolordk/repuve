import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type AccessFeedbackModalVariant = 'success' | 'error';

@Component({
    selector: 'app-access-feedback-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './access-feedback-modal.html',
    styleUrl: './access-feedback-modal.scss'
})
export class AccessFeedbackModalComponent {
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