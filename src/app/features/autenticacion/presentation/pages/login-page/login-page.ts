import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';
import { AuthFacade } from '../../../application/facades/auth-facade';
import { LoginFormEntity } from '../../../domain/entities/login-form.entity';
import {
  AccessFeedbackModalComponent,
  AccessFeedbackModalVariant
} from '../../../../../shared/components/access-feedback-modal/access-feedback-modal';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuthShellComponent,
    AccessFeedbackModalComponent
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginComponent implements OnInit {
  private readonly authFacade = inject(AuthFacade);

  model: LoginFormEntity = {
    usuario: '',
    correoElectronico: '',
    numeroCelular: '',
    captchaId: '',
    captchaRespuesta: ''
  };

  captchaImageSrc = '';
  loadingCaptcha = false;
  submitting = false;
  errorMessage = '';

  modalState = {
    isOpen: false,
    variant: 'success' as AccessFeedbackModalVariant,
    message: '',
    emailMasked: ''
  };

  ngOnInit(): void {
    this.loadCaptcha();
  }

  loadCaptcha(): void {
    this.loadingCaptcha = true;
    this.errorMessage = '';

    this.authFacade.getCaptcha().subscribe({
      next: (captcha) => {
        this.model.captchaId = captcha.captchaId;
        this.model.captchaRespuesta = '';
        this.captchaImageSrc = captcha.captchaImage;
        this.loadingCaptcha = false;
      },
      error: () => {
        this.loadingCaptcha = false;
        this.errorMessage = 'No se pudo cargar el captcha.';
      }
    });
  }

  submit(): void {
    if (this.submitting) return;

    this.errorMessage = '';
    this.submitting = true;

    this.authFacade.login(this.model).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: () => {
        this.openSuccessModal(this.maskEmail(this.model.correoElectronico));
      },
      error: (error) => {
        const backendMessage =
          error?.error?.message ||
          error?.error?.mensaje ||
          error?.message ||
          'No se pudo completar la solicitud.';

        this.openErrorModal(backendMessage);
        this.loadCaptcha();
      }
    });
  }

  closeModal(): void {
    this.modalState.isOpen = false;
  }

  onModalAccept(): void {
    const currentVariant = this.modalState.variant;
    this.closeModal();

    if (currentVariant === 'success') {
      console.log('Continuar flujo despues del alta o envio de enlace');
      // aquí después puedes navegar a otra pantalla si aplica
    }
  }

  private openSuccessModal(maskedEmail: string): void {
    this.modalState = {
      isOpen: true,
      variant: 'success',
      message: '',
      emailMasked: maskedEmail
    };
  }

  private openErrorModal(message: string): void {
    this.modalState = {
      isOpen: true,
      variant: 'error',
      message,
      emailMasked: ''
    };
  }

  private maskEmail(email: string): string {
    const normalizedEmail = (email ?? '').trim();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return 'tu correo registrado';
    }

    const [localPart, domain] = normalizedEmail.split('@');

    if (!localPart || !domain) {
      return normalizedEmail;
    }

    if (localPart.length <= 2) {
      return `${localPart[0] ?? '*'}*****@${domain}`;
    }

    return `${localPart[0]}*****${localPart[localPart.length - 1]}@${domain}`;
  }
}