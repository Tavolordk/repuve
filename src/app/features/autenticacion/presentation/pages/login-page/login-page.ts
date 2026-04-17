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

/**
 * Longitud esperada de la cuenta que se envía por correo al crear una nueva cuenta.
 * Cuando el usuario escribe un valor de esta longitud asumimos que está validando
 * un usuario existente (proveniente del correo) y se oculta correo/celular.
 */
const EXISTING_USER_ACCOUNT_LENGTH = 14;

/**
 * Razones internas que controlan qué debe pasar cuando el usuario cierra el modal.
 *  - 'success-new-account' → se creó una nueva cuenta: mostrar pantalla "Proceso iniciado"
 *  - 'user-validated'      → validación de usuario existente: pasar a verification-code
 *  - 'error' | 'info'      → no cambiar de pantalla, solo cerrar el modal (bug reportado
 *                            en Página 4: antes siempre se iba a "Proceso iniciado")
 */
type ModalIntent = 'success-new-account' | 'user-validated' | 'error' | 'info';

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
  verificationCodeSent = false;
  maskedContact = '';

  sendingVerificationCode = false;
  validatingVerificationCode = false;

  // Página 7: bandera que indica si el usuario capturado proviene del correo
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
  }

  /**
   * Página 7: al escribir el usuario, si la longitud coincide con la de una cuenta
   * recibida por correo, se activa el flujo de "validar usuario existente":
   * se ocultan correo y celular y cambia el botón a "Validar usuario".
   */
  onUsuarioChange(value: string): void {
    const trimmed = (value ?? '').trim();
    const matchesExistingAccountLength = trimmed.length === EXISTING_USER_ACCOUNT_LENGTH;

    if (matchesExistingAccountLength !== this.isExistingUserFlow) {
      this.isExistingUserFlow = matchesExistingAccountLength;
      this.userValidated = false;
      if (this.isExistingUserFlow) {
        // Ya no son necesarios al validar usuario existente
        this.model.correoElectronico = '';
        this.model.numeroCelular = '';
      }
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

    // Página 7: si es flujo de validación de usuario existente, se usa un camino distinto.
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

        // Página 2: mensaje con mejor redacción (se arma en la propia modal).
        this.openSuccessModal(
          response.mensaje || 'Enviamos un enlace de verificación a tu correo para activar tu nueva cuenta.',
          'success-new-account'
        );

        this.cdr.detectChanges();
      },
      error: (error) => {
        const backendMessage =
          error?.error?.message ||
          error?.error?.mensaje ||
          error?.message ||
          'No se pudo completar la solicitud.';

        // Página 4: mensaje de error cuando no existe la cuenta (el modal se encarga del texto detallado).
        this.openErrorModal(backendMessage);
        this.loadCaptcha();
      }
    });
  }

  /**
   * Página 7: al dar clic en "Validar usuario" se confirma que la cuenta existe;
   * al aceptar el modal se navega automáticamente a verification-code (Página 8).
   */
  private validateExistingUser(): void {
    // TODO(backend): reemplazar por un endpoint real de validación de usuario si existe.
    // De momento reutilizamos el método existente para no romper la integración.
    this.authFacade.login(this.model).pipe(
      timeout(15000),
      finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response) => {
        this.authSessionService.saveSession(response);

        // En el flujo de "validar usuario existente" correo y celular no se capturan
        // en el front; el backend los resolverá al enviar el código de verificación.
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

    // Página 4 — Bug corregido:
    // antes se llamaba a openActivationTabAndShowCloseMessage() en toda ocasión,
    // lo que mostraba la pantalla "Proceso iniciado correctamente" aun cuando la modal
    // era un error. Ahora la acción depende del `intent` de la modal.
    this.handleModalDismiss();
  }

  onModalAccept(): void {
    this.handleModalDismiss();
  }

  private handleModalDismiss(): void {
    const intent = this.modalState.intent;

    // Cerrar siempre el modal
    this.modalState.isOpen = false;

    switch (intent) {
      case 'success-new-account':
        // Mostrar la pantalla "Proceso iniciado correctamente" (Página 3).
        this.showCloseTabMessage = true;
        this.currentStep = 'done';
        break;

      case 'user-validated':
        // Página 8: ir automáticamente a la pantalla de código de verificación.
        this.verificationCode = '';
        this.verificationCodeSent = false;
        this.maskedContact = '';
        this.currentStep = 'verification-code';
        this.loadCaptcha();
        break;

      case 'error':
      case 'info':
      default:
        // Bug Página 4: NO navegar, solo cerrar la modal y permanecer en Login.
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

  /** Página 7: modal "✅ Usuario válido" con botón Aceptar. */
  private openUserValidatedModal(): void {
    this.modalState = {
      isOpen: true,
      variant: 'success',
      message: '✅ Usuario válido',
      emailMasked: '',
      intent: 'user-validated'
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

  /** Página 9: enmascara un número de teléfono manteniendo primeros 2 y últimos 2 dígitos. */
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
        // Página 9: calcular destino enmascarado según canal.
        this.maskedContact = this.verificationChannel === 'email'
          ? this.maskEmail(this.verificationStepData.correoElectronico)
          : this.maskPhone(this.verificationStepData.numeroCelular);
        this.verificationCodeSent = true;

        this.openSuccessModal(
          response.mensaje || 'El código de verificación fue enviado correctamente.',
          'info'
        );
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
        this.openSuccessModal(
          response.mensaje || 'La validación se realizó correctamente.',
          'info'
        );
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
    this.verificationCodeSent = false;
    this.maskedContact = '';
    this.errorMessage = '';
    this.loadCaptcha();
    this.cdr.detectChanges();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}