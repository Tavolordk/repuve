import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize, timeout } from 'rxjs';

import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';
import { BlockedAccountModalComponent } from '../../../../../shared/components/blocked-account-modal/blocked-account-modal';
import {
    AccessFeedbackModalComponent,
    AccessFeedbackModalVariant
} from '../../../../../shared/components/access-feedback-modal/access-feedback-modal';
import { BlockedAccountFacade } from '../../../application/facades/blocked-account-facade';

/**
 * Pasos de la página:
 *  - 'blocked-dialog'  → Etapa 1: modal de cuenta bloqueada (Pantalla 1)
 *  - 'form'            → Etapa 2: formulario de activación (Pantalla 2)
 *  - 'request-sent'    → Etapa 2: confirmación de solicitud enviada (Pantalla 3)
 *  - 'verify-code'     → Etapa 4: ingreso del código de verificación (Pantalla 8)
 *  - 'done'            → Etapa 4: resultado exitoso (Pantalla 9)
 *  - 'code-error'      → Etapa 4: código inválido o expirado (Pantalla 10)
 */
type PageStep = 'blocked-dialog' | 'form' | 'request-sent' | 'verify-code' | 'done' | 'code-error';

/** Duración del código de verificación en segundos (5 minutos). */
const CODE_TTL_SECONDS = 5 * 60;

@Component({
    selector: 'app-blocked-activation-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AuthShellComponent,
        BlockedAccountModalComponent,
        AccessFeedbackModalComponent
    ],
    templateUrl: './blocked-activation-page.html',
    styleUrl: './blocked-activation-page.scss'
})
export class BlockedActivationPageComponent implements OnInit, OnDestroy {
    private readonly facade = inject(BlockedAccountFacade);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    step: PageStep = 'blocked-dialog';

    /* ── Etapa 1 ──────────────────────────────────────────────────────── */
    blockedModalOpen = true;

    /* ── Etapa 2: formulario ──────────────────────────────────────────── */
    model = {
        usuario: '',
        correoElectronico: '',
        captchaId: '',
        captchaRespuesta: ''
    };

    captchaImageSrc = '';
    loadingCaptcha = false;
    captchaExpired = false;
    captchaTtlSeconds = 0;
    submitting = false;
    errorMessage = '';

    /* ── Etapa 4: código de verificación ──────────────────────────────── */
    verificationCode = '';
    validating = false;
    codeErrorMessage = '';

    /* ── Cuenta regresiva del código (5 min) ──────────────────────────── */
    codeTtlSeconds = 0;
    codeExpired = false;
    private codeCountdownId: ReturnType<typeof setInterval> | null = null;

    /* ── Modal de feedback ────────────────────────────────────────────── */
    feedbackModal = {
        isOpen: false,
        variant: 'success' as AccessFeedbackModalVariant,
        message: ''
    };

    private captchaSub?: Subscription;
    private countdownId: ReturnType<typeof setInterval> | null = null;
    private captchaVersion = 0;

    ngOnInit(): void {
        // Si llega con ?step=verify-code (redirigido desde el correo de aprobación)
        const stepParam = this.route.snapshot.queryParamMap.get('step');
        const usuario = this.route.snapshot.queryParamMap.get('usuario');

        if (stepParam === 'verify-code' && usuario) {
            this.model.usuario = usuario;
            this.step = 'verify-code';
            this.blockedModalOpen = false;
            this.startCodeCountdown();
        }
    }

    ngOnDestroy(): void {
        this.captchaSub?.unsubscribe();
        this.stopCountdown();
        this.stopCodeCountdown();
    }

    /* ══════════════════════════════════════════════════════════════════
       ETAPA 1 – Modal de cuenta bloqueada
       ══════════════════════════════════════════════════════════════════ */

    onBlockedCancel(): void {
        this.blockedModalOpen = false;
        this.router.navigate(['/login'], { replaceUrl: true });
    }

    onBlockedActivate(): void {
        this.blockedModalOpen = false;
        this.step = 'form';
        this.loadCaptcha();
    }

    /* ══════════════════════════════════════════════════════════════════
       ETAPA 2 – Formulario de activación
       ══════════════════════════════════════════════════════════════════ */

    submitActivation(): void {
        if (this.submitting || this.loadingCaptcha) return;

        if (!this.model.captchaId || this.captchaExpired) {
            this.errorMessage = 'El captcha expiró. Solicita uno nuevo.';
            return;
        }

        this.errorMessage = '';
        this.submitting = true;

        this.facade.requestActivation({
            usuario: this.model.usuario.trim(),
            correoElectronico: this.model.correoElectronico.trim(),
            captchaId: this.model.captchaId,
            captchaRespuesta: this.model.captchaRespuesta
        }).pipe(
            timeout(15000),
            finalize(() => {
                this.submitting = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: () => {
                this.step = 'request-sent';
                this.cdr.detectChanges();
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo enviar la solicitud de activación.';
                this.loadCaptcha();
            }
        });
    }

    /* ══════════════════════════════════════════════════════════════════
       ETAPA 4 – Validar código de verificación
       ══════════════════════════════════════════════════════════════════ */

    goToVerifyCode(): void {
        this.step = 'verify-code';
        this.verificationCode = '';
        this.codeErrorMessage = '';
        this.startCodeCountdown();
        this.cdr.detectChanges();
    }

    validateCode(): void {
        const code = this.verificationCode.trim();
        if (code.length < 6 || this.validating) return;

        if (this.codeExpired) {
            this.codeErrorMessage = 'El código ha expirado. Solicita uno nuevo repitiendo el proceso de activación.';
            return;
        }

        this.validating = true;
        this.codeErrorMessage = '';

        this.facade.validateBlockedCode({
            usuario: this.model.usuario.trim(),
            codigo: code
        }).pipe(
            timeout(15000),
            finalize(() => {
                this.validating = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                if (response.codigoVerificado) {
                    this.stopCodeCountdown();
                    this.step = 'done';
                } else {
                    this.step = 'code-error';
                    this.stopCodeCountdown();
                    this.codeErrorMessage = response.mensaje || 'El código ingresado no es válido o ha expirado.';
                    this.verificationCode = '';
                }
            },
            error: (error) => {
                this.step = 'code-error';
                this.stopCodeCountdown();
                this.codeErrorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo validar el código.';
                this.verificationCode = '';
            }
        });
    }

    retryActivation(): void {
        this.verificationCode = '';
        this.codeErrorMessage = '';
        this.stopCodeCountdown();
        this.step = 'form';
        this.errorMessage = '';
        this.model.captchaRespuesta = '';
        this.loadCaptcha();
    }

    goToLogin(): void {
        this.router.navigate(['/login'], { replaceUrl: true });
    }

    /* ══════════════════════════════════════════════════════════════════
       Cuenta regresiva del código de verificación (5 minutos)
       ══════════════════════════════════════════════════════════════════ */

    private startCodeCountdown(): void {
        this.stopCodeCountdown();
        this.codeTtlSeconds = CODE_TTL_SECONDS;
        this.codeExpired = false;

        this.codeCountdownId = setInterval(() => {
            if (this.codeTtlSeconds > 0) {
                this.codeTtlSeconds--;
            }

            if (this.codeTtlSeconds <= 0) {
                this.codeTtlSeconds = 0;
                this.codeExpired = true;
                this.stopCodeCountdown();
            }

            this.cdr.detectChanges();
        }, 1000);
    }

    private stopCodeCountdown(): void {
        if (this.codeCountdownId) {
            clearInterval(this.codeCountdownId);
            this.codeCountdownId = null;
        }
    }

    get codeTimeLabel(): string {
        const m = Math.floor(this.codeTtlSeconds / 60);
        const s = this.codeTtlSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /** Porcentaje restante de 0 a 100 para la barra de progreso. */
    get codeProgressPercent(): number {
        if (CODE_TTL_SECONDS === 0) return 0;
        return (this.codeTtlSeconds / CODE_TTL_SECONDS) * 100;
    }

    /** true cuando queda menos de 1 minuto. */
    get codeIsUrgent(): boolean {
        return this.codeTtlSeconds > 0 && this.codeTtlSeconds <= 60;
    }

    /* ══════════════════════════════════════════════════════════════════
       Captcha (reutilizado del patrón existente)
       ══════════════════════════════════════════════════════════════════ */

    loadCaptcha(): void {
        const currentVersion = ++this.captchaVersion;
        this.captchaSub?.unsubscribe();
        this.stopCountdown();

        this.loadingCaptcha = true;
        this.captchaExpired = false;
        this.captchaTtlSeconds = 0;
        this.model.captchaId = '';
        this.model.captchaRespuesta = '';
        this.captchaImageSrc = '';

        this.cdr.detectChanges();

        this.captchaSub = this.facade.getCaptcha().pipe(
            timeout(15000),
            finalize(() => {
                if (currentVersion === this.captchaVersion) {
                    this.loadingCaptcha = false;
                    this.cdr.detectChanges();
                }
            })
        ).subscribe({
            next: (captcha) => {
                if (currentVersion !== this.captchaVersion) return;
                this.model.captchaId = captcha.captchaId;
                this.captchaImageSrc = captcha.captchaImage;
                this.captchaTtlSeconds = captcha.ttlSeconds ?? 0;
                this.captchaExpired = false;
                this.startCountdown();
                this.cdr.detectChanges();
            },
            error: () => {
                if (currentVersion !== this.captchaVersion) return;
                this.errorMessage = 'No se pudo cargar el captcha.';
                this.captchaExpired = true;
                this.cdr.detectChanges();
            }
        });
    }

    private startCountdown(): void {
        this.stopCountdown();
        this.countdownId = setInterval(() => {
            if (this.captchaTtlSeconds > 0) this.captchaTtlSeconds--;
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
        if (this.countdownId) {
            clearInterval(this.countdownId);
            this.countdownId = null;
        }
    }

    get captchaTimeLabel(): string {
        const m = Math.floor(this.captchaTtlSeconds / 60);
        const s = this.captchaTtlSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }


    closeFeedbackModal(): void {
        this.feedbackModal.isOpen = false;
    }
}