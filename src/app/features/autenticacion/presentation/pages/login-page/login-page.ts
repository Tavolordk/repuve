import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, finalize, timeout } from 'rxjs';

import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';
import { AuthFacade } from '../../../application/facades/auth-facade';
import { LoginFormEntity } from '../../../domain/entities/login-form.entity';
import {
  AccessFeedbackModalComponent,
  AccessFeedbackModalVariant
} from '../../../../../shared/components/access-feedback-modal/access-feedback-modal';
import { AuthSessionService } from '../../../infrastructure/services/auth-session.service';

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
export class LoginComponent implements OnInit, OnDestroy {
  private readonly authFacade = inject(AuthFacade);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  showCloseTabMessage = false;
  private captchaSubscription?: Subscription;
  private countdownIntervalId: ReturnType<typeof setInterval> | null = null;
  private captchaRequestVersion = 0;

  currentStep: 'access' | 'verification-code' | 'done' = 'access';

  verificationChannel: 'email' | 'telegram' = 'email';
  verificationCode = '';

  sendingVerificationCode = false;
  validatingVerificationCode = false;

  verificationStepData = {
    usuario: '',
    correoElectronico: '',
    numeroCelular: '',
    token: '',
    expiracionMinutos: 0,
    fechaExpiracionUtc: ''
  };

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

  captchaTtlSeconds = 0;
  captchaExpired = false;

  modalState = {
    isOpen: false,
    variant: 'success' as AccessFeedbackModalVariant,
    message: '',
    emailMasked: ''
  };

  ngOnInit(): void {
    this.currentStep = 'access';
    this.loadCaptcha();
  }

  ngOnDestroy(): void {
    this.captchaSubscription?.unsubscribe();
    this.stopCountdown();
  }

  loadCaptcha(): void {
    const currentVersion = ++this.captchaRequestVersion;

    this.captchaSubscription?.unsubscribe();
    this.stopCountdown();

    this.loadingCaptcha = true;
    this.errorMessage = '';
    this.captchaExpired = false;
    this.captchaTtlSeconds = 0;

    this.model.captchaId = '';
    this.model.captchaRespuesta = '';
    this.captchaImageSrc = '';

    this.cdr.detectChanges();

    this.captchaSubscription = this.authFacade.getCaptcha()
      .pipe(
        timeout(15000),
        finalize(() => {
          if (currentVersion === this.captchaRequestVersion) {
            this.loadingCaptcha = false;
            this.cdr.detectChanges();
          }
        })
      )
      .subscribe({
        next: (captcha) => {
          if (currentVersion !== this.captchaRequestVersion) {
            return;
          }

          this.model.captchaId = captcha.captchaId;
          this.model.captchaRespuesta = '';
          this.captchaImageSrc = captcha.captchaImage;
          this.captchaTtlSeconds = captcha.ttlSeconds ?? 0;
          this.captchaExpired = false;

          this.startCountdown();
          this.cdr.detectChanges();
        },
        error: () => {
          if (currentVersion !== this.captchaRequestVersion) {
            return;
          }

          this.errorMessage = 'No se pudo cargar el captcha.';
          this.captchaImageSrc = '';
          this.model.captchaId = '';
          this.captchaExpired = true;
          this.cdr.detectChanges();
        }
      });
  }

  private startCountdown(): void {
    this.stopCountdown();

    this.countdownIntervalId = setInterval(() => {
      if (this.captchaTtlSeconds > 0) {
        this.captchaTtlSeconds--;
      }

      if (this.captchaTtlSeconds <= 0) {
        this.captchaTtlSeconds = 0;
        this.captchaExpired = true;
        this.model.captchaId = '';
        this.stopCountdown();
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownIntervalId) {
      clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
  }

  get captchaTimeLabel(): string {
    const minutes = Math.floor(this.captchaTtlSeconds / 60);
    const seconds = this.captchaTtlSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  submit(): void {
    if (this.submitting || this.loadingCaptcha) return;

    if (!this.model.captchaId) {
      this.errorMessage = 'Primero carga un captcha válido.';
      return;
    }

    if (this.captchaExpired) {
      this.errorMessage = 'El captcha expiró. Solicita uno nuevo.';
      return;
    }

    this.errorMessage = '';
    this.submitting = true;

    this.authFacade.login(this.model).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.authSessionService.saveSession(response);

        this.verificationStepData = {
          usuario: this.model.usuario,
          correoElectronico: this.model.correoElectronico,
          numeroCelular: this.model.numeroCelular,
          token: response.token,
          expiracionMinutos: response.expiracionMinutos,
          fechaExpiracionUtc: response.fechaExpiracionUtc
        };

        this.openSuccessModal(
          response.mensaje || 'Enviamos un enlace a tu correo para continuar.'
        );

        this.cdr.detectChanges();
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
    if (!this.modalState.isOpen) return;

    this.openActivationTabAndShowCloseMessage();
  }

  onModalAccept(): void {
    this.openActivationTabAndShowCloseMessage();
  }

  private openSuccessModal(message: string): void {
    this.modalState = {
      isOpen: true,
      variant: 'success',
      message,
      emailMasked: this.maskEmail(this.model.correoElectronico)
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

  selectVerificationChannel(channel: 'email' | 'telegram'): void {
    this.verificationChannel = channel;
    this.errorMessage = '';
  }

  sendVerificationCode(): void {
    if (this.sendingVerificationCode) return;

    if (!this.verificationStepData.usuario.trim()) {
      this.errorMessage = 'No se encontró el usuario para enviar el código.';
      return;
    }

    if (!this.model.captchaId || this.captchaExpired) {
      this.errorMessage = 'El captcha actual expiró. Refresca el captcha antes de enviar el código.';
      return;
    }

    this.errorMessage = '';
    this.sendingVerificationCode = true;

    this.authFacade.sendVerificationCode({
      usuario: this.verificationStepData.usuario,
      correoElectronico: this.verificationStepData.correoElectronico || null,
      numeroCelular: this.verificationStepData.numeroCelular || null,
      medioContacto: this.verificationChannel === 'email' ? 'correo' : 'telegram',
      captchaId: this.model.captchaId,
      captchaRespuesta: this.model.captchaRespuesta
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.sendingVerificationCode = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.openSuccessModal(response.mensaje || 'El código de verificación fue enviado correctamente.');
        this.loadCaptcha();
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.mensaje ||
          error?.message ||
          'No se pudo enviar el código de verificación.';
        this.loadCaptcha();
      }
    });
  }

  validateVerificationCode(): void {
    if (this.validatingVerificationCode) return;

    if (!this.verificationCode.trim()) {
      this.errorMessage = 'Ingresa el código de verificación.';
      return;
    }

    this.errorMessage = '';
    this.validatingVerificationCode = true;

    this.authFacade.verifyCode({
      usuario: this.verificationStepData.usuario,
      codigo: this.verificationCode.trim(),
      medioContacto: this.verificationChannel === 'email' ? 'correo' : 'telegram'
    }).pipe(
      timeout(15000),
      finalize(() => {
        this.validatingVerificationCode = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        if (!response.codigoVerificado) {
          this.errorMessage = response.mensaje || 'El código no pudo ser validado.';
          return;
        }

        this.currentStep = 'done';
        this.openSuccessModal(response.mensaje || 'La validación se realizó correctamente.');
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.mensaje ||
          error?.message ||
          'No se pudo validar el código.';
      }
    });
  }

  goBackToAccess(): void {
    this.currentStep = 'access';
    this.verificationCode = '';
    this.errorMessage = '';
    this.loadCaptcha();
    this.cdr.detectChanges();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
  openActivationTabAndShowCloseMessage(): void {
    this.showCloseTabMessage = true;
    this.currentStep = 'done';
    this.modalState.isOpen = false;
    this.cdr.detectChanges();
  }
}