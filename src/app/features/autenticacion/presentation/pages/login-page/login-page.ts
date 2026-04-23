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
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faClock } from '@fortawesome/free-solid-svg-icons';

const EXISTING_USER_ACCOUNT_LENGTH = 14;
type ModalIntent = 'success-new-account' | 'user-validated' | 'error' | 'info';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AuthShellComponent,
    AccessFeedbackModalComponent, FontAwesomeModule,
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
  protected readonly faCircleCheck = faCircleCheck;
  protected readonly faClock = faClock;
  currentStep: 'access' | 'verification-code' | 'done' = 'access';

  verificationChannel: 'email' | 'telegram' = 'email';
  verificationCode = '';
  verificationCodeSent = false;
  maskedContact = '';

  sendingVerificationCode = false;
  validatingVerificationCode = false;

  verificationTimerSeconds = 0;
  verificationTimerExpired = false;
  private verificationTimerIntervalId: ReturnType<typeof setInterval> | null = null;

  isExistingUserFlow = false;
  userValidated = false;

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
    emailMasked: '',
    intent: 'info' as ModalIntent
  };

  ngOnInit(): void {
    this.currentStep = 'access';
    this.loadCaptcha();
  }

  ngOnDestroy(): void {
    this.captchaSubscription?.unsubscribe();
    this.stopCountdown();
    this.stopVerificationTimer();
  }

  onUsuarioChange(value: string): void {
    const trimmed = (value ?? '').trim();
    const matchesExistingAccountLength = trimmed.length === EXISTING_USER_ACCOUNT_LENGTH;

    if (matchesExistingAccountLength !== this.isExistingUserFlow) {
      this.isExistingUserFlow = matchesExistingAccountLength;
      this.userValidated = false;
    }
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

  get verificationTimerLabel(): string {
    const minutes = Math.floor(this.verificationTimerSeconds / 60);
    const seconds = this.verificationTimerSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private startVerificationTimer(): void {
    this.stopVerificationTimer();
    this.verificationTimerSeconds = 5 * 60;
    this.verificationTimerExpired = false;

    this.verificationTimerIntervalId = setInterval(() => {
      if (this.verificationTimerSeconds > 0) {
        this.verificationTimerSeconds--;
      }

      if (this.verificationTimerSeconds <= 0) {
        this.verificationTimerSeconds = 0;
        this.verificationTimerExpired = true;
        this.stopVerificationTimer();
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private stopVerificationTimer(): void {
    if (this.verificationTimerIntervalId) {
      clearInterval(this.verificationTimerIntervalId);
      this.verificationTimerIntervalId = null;
    }
  }

  resendVerificationCode(): void {
    this.verificationCodeSent = false;
    this.verificationCode = '';
    this.verificationTimerExpired = false;
    this.verificationTimerSeconds = 0;
    this.maskedContact = '';
    this.errorMessage = '';
    this.stopVerificationTimer();
    this.loadCaptcha();
    this.cdr.detectChanges();
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
    this.normalizeCaptchaToUpperCase();

    if (this.isExistingUserFlow) {
      this.validateExistingUser();
      return;
    }

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
          response.mensaje || 'Enviamos un enlace de verificación a tu correo para activar tu nueva cuenta.',
          'success-new-account'
        );

        this.cdr.detectChanges();
      },
      error: (error) => {
        if (this.handleBlockedAccountError(error)) {
          return;
        }

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


  private validateExistingUser(): void {

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
          correoElectronico: '',
          numeroCelular: '',
          token: response.token,
          expiracionMinutos: response.expiracionMinutos,
          fechaExpiracionUtc: response.fechaExpiracionUtc
        };

        this.userValidated = true;
        this.openUserValidatedModal();
      },
      error: (error) => {
        if (this.handleBlockedAccountError(error)) {
          return;
        }

        const backendMessage =
          error?.error?.message ||
          error?.error?.mensaje ||
          error?.message ||
          'No se pudo validar el usuario.';

        this.openErrorModal(backendMessage);
        this.loadCaptcha();
      }
    });
  }

  closeModal(): void {
    if (!this.modalState.isOpen) return;
    this.handleModalDismiss();
  }

  onModalAccept(): void {
    this.handleModalDismiss();
  }

  private handleModalDismiss(): void {
    const intent = this.modalState.intent;

    this.modalState.isOpen = false;

    switch (intent) {
      case 'success-new-account':
        this.showCloseTabMessage = true;
        this.currentStep = 'done';
        break;

      case 'user-validated':
        this.verificationCode = '';
        this.verificationCodeSent = false;
        this.maskedContact = '';
        this.currentStep = 'verification-code';
        this.loadCaptcha();
        break;

      case 'error':
      case 'info':
      default:
        break;
    }

    this.cdr.detectChanges();
  }

  private openSuccessModal(message: string, intent: ModalIntent = 'info'): void {
    this.modalState = {
      isOpen: true,
      variant: 'success',
      message,
      emailMasked: this.maskEmail(this.model.correoElectronico),
      intent
    };
  }

  private openErrorModal(message: string): void {
    this.modalState = {
      isOpen: true,
      variant: 'error',
      message,
      emailMasked: '',
      intent: 'error'
    };
  }

  /**
   * Detecta una respuesta de cuenta bloqueada y navega DIRECTAMENTE a la
   * pantalla de cuenta bloqueada, sin abrir ningún modal intermedio.
   */
  private handleBlockedAccountError(error: unknown): boolean {
    const err = error as {
      status?: number;
      error?: { cuentaBloqueada?: boolean; data?: { cuentaBloqueada?: boolean } };
    };

    const isBloqueada =
      err?.status === 423 ||
      err?.error?.cuentaBloqueada === true ||
      err?.error?.data?.cuentaBloqueada === true;

    if (!isBloqueada) {
      return false;
    }

    this.modalState.isOpen = false;
    this.router.navigate(['/cuenta-bloqueada']);
    return true;
  }

  private openUserValidatedModal(): void {
    this.modalState = {
      isOpen: true,
      variant: 'success',
      message: '✅ Usuario válido',
      emailMasked: '',
      intent: 'user-validated'
    };
  }

  private normalizeCaptchaToUpperCase(): void {
    this.model.captchaRespuesta = (this.model.captchaRespuesta ?? '').toUpperCase();
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

  private maskPhone(phone: string): string {
    const digits = (phone ?? '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 4) return digits;
    const start = digits.slice(0, 2);
    const end = digits.slice(-2);
    const middleMask = '*'.repeat(Math.max(4, digits.length - 4));
    return `${start}${middleMask}${end}`;
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

    // Validación del campo dinámico según el canal seleccionado.
    const correoInput = (this.verificationStepData.correoElectronico ?? '').trim();
    const celularInput = (this.verificationStepData.numeroCelular ?? '').replace(/\D/g, '');

    if (this.verificationChannel === 'email') {
      if (!correoInput) {
        this.errorMessage = 'Ingresa el correo electrónico para recibir el código.';
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correoInput)) {
        this.errorMessage = 'Ingresa un correo electrónico válido.';
        return;
      }
    } else {
      if (!celularInput) {
        this.errorMessage = 'Ingresa el número de celular para recibir el código por Telegram.';
        return;
      }

      if (celularInput.length !== 10) {
        this.errorMessage = 'El número de celular debe tener 10 dígitos.';
        return;
      }
    }

    this.verificationStepData.correoElectronico = correoInput;
    this.verificationStepData.numeroCelular = celularInput;

    this.errorMessage = '';
    this.sendingVerificationCode = true;
    this.normalizeCaptchaToUpperCase();

    // Bearer token recibido en el paso previo (login / validateExistingUser).
    const bearerToken =
      this.verificationStepData.token || this.authSessionService.getToken() || undefined;

    this.authFacade.sendVerificationCode({
      usuario: this.verificationStepData.usuario,
      correoElectronico: this.verificationChannel === 'email' ? correoInput : null,
      numeroCelular: this.verificationChannel === 'telegram' ? celularInput : null,
      medioContacto: this.verificationChannel === 'email' ? 'correo' : 'telegram',
      captchaId: this.model.captchaId,
      captchaRespuesta: this.model.captchaRespuesta
    }, bearerToken).pipe(
      timeout(15000),
      finalize(() => {
        this.sendingVerificationCode = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.maskedContact = this.verificationChannel === 'email'
          ? this.maskEmail(this.verificationStepData.correoElectronico)
          : this.maskPhone(this.verificationStepData.numeroCelular);

        this.verificationCodeSent = true;
        this.verificationCode = '';
        this.errorMessage = '';

        this.startVerificationTimer();

        this.model.captchaId = '';
        this.model.captchaRespuesta = '';
        this.captchaImageSrc = '';
        this.captchaExpired = false;
        this.captchaTtlSeconds = 0;
        this.stopCountdown();

        this.cdr.detectChanges();
      },
      error: (error) => {
        if (this.handleBlockedAccountError(error)) {
          return;
        }

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

    const bearerToken =
      this.verificationStepData.token || this.authSessionService.getToken() || undefined;

    this.authFacade.verifyCode({
      usuario: this.verificationStepData.usuario,
      codigo: this.verificationCode.trim().toUpperCase(),
      medioContacto: this.verificationChannel === 'email' ? 'correo' : 'telegram'
    }, bearerToken).pipe(
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
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (error) => {
        if (this.handleBlockedAccountError(error)) {
          return;
        }

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
    this.verificationCodeSent = false;
    this.maskedContact = '';
    this.errorMessage = '';
    this.stopVerificationTimer();
    this.verificationTimerExpired = false;
    this.verificationTimerSeconds = 0;
    this.loadCaptcha();
    this.cdr.detectChanges();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}