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
import { AuthFacade } from '../../../application/facades/auth-facade';

type PageStep = 'loading' | 'verify-code' | 'done' | 'error';

@Component({
    selector: 'app-account-activation-page',
    standalone: true,
    imports: [CommonModule, FormsModule, AuthShellComponent],
    templateUrl: './account-activation-page.html',
    styleUrl: './account-activation-page.scss'
})
export class AccountActivationPageComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authFacade = inject(AuthFacade);
    private readonly cdr = inject(ChangeDetectorRef);
    codeSent = false;
    step: PageStep = 'loading';
    usuario = '';
    errorMessage = '';
    successMessage = '';

    // Canal de verificación
    verificationChannel: 'email' | 'telegram' = 'email';

    // Código ingresado por el usuario
    verificationCode = '';

    // Captcha
    captchaId = '';
    captchaRespuesta = '';
    captchaImageSrc = '';
    loadingCaptcha = false;
    captchaExpired = false;
    captchaTtlSeconds = 0;

    // Estados de acciones
    sendingCode = false;
    validating = false;

    // Token de activación recibido de iniciarFlujoActivacion
    private activationToken = '';
    private captchaSubscription?: Subscription;
    private countdownIntervalId: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        const token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

        // Página 6: si no hay token (enlace ya expirado o inválido)
        // redirigir directamente al Login en lugar de mostrar "Activación fallida".
        if (!token) {
            this.redirectToLogin();
            return;
        }

        this.authFacade.startActivationFlow({ token }).pipe(
            timeout(15000),
            finalize(() => this.cdr.detectChanges())
        ).subscribe({
            next: (response) => {
                if (response.flujoActivacionIniciado) {
                    this.usuario = response.usuario ?? '';
                    this.activationToken = response.token ?? '';
                    this.step = 'verify-code';
                    this.loadCaptcha();
                } else {
                    // Página 6: token expirado / inválido → ir al Login en vez de pantalla de error.
                    this.redirectToLogin();
                }
            },
            error: () => {
                // Página 6: cualquier error del backend (incluye 24h expirado) → redirigir al Login.
                this.redirectToLogin();
            }
        });
    }

    ngOnDestroy(): void {
        this.captchaSubscription?.unsubscribe();
        this.stopCountdown();
    }

    /**
     * Página 6: al dar clic en un enlace expirado o inválido, se redirige a la
     * pantalla principal de Login. No se muestra la pantalla "Activación fallida".
     */
    private redirectToLogin(): void {
        this.router.navigate(['/login'], { replaceUrl: true });
    }

    // ── Captcha ───────────────────────────────────────────────────────────────

    loadCaptcha(): void {
        this.captchaSubscription?.unsubscribe();
        this.stopCountdown();

        this.loadingCaptcha = true;
        this.captchaExpired = false;
        this.captchaId = '';
        this.captchaRespuesta = '';
        this.captchaImageSrc = '';
        this.errorMessage = '';

        this.cdr.detectChanges();

        this.captchaSubscription = this.authFacade.getCaptcha().pipe(
            timeout(15000),
            finalize(() => {
                this.loadingCaptcha = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (captcha) => {
                this.captchaId = captcha.captchaId;
                this.captchaImageSrc = captcha.captchaImage;
                this.captchaTtlSeconds = captcha.ttlSeconds ?? 0;
                this.captchaExpired = false;
                this.startCountdown();
            },
            error: () => {
                this.errorMessage = 'No se pudo cargar el captcha.';
                this.captchaExpired = true;
            }
        });
    }

    private startCountdown(): void {
        this.stopCountdown();
        this.countdownIntervalId = setInterval(() => {
            if (this.captchaTtlSeconds > 0) this.captchaTtlSeconds--;
            if (this.captchaTtlSeconds <= 0) {
                this.captchaTtlSeconds = 0;
                this.captchaExpired = true;
                this.captchaId = '';
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
        const m = Math.floor(this.captchaTtlSeconds / 60);
        const s = this.captchaTtlSeconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ── Canal ────────────────────────────────────────────────────────────────

    selectChannel(channel: 'email' | 'telegram'): void {
        this.verificationChannel = channel;
        this.errorMessage = '';
    }

    // ── Enviar código ────────────────────────────────────────────────────────

    sendCode(): void {
        if (this.sendingCode || !this.captchaId || this.captchaExpired) return;

        this.sendingCode = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.authFacade.sendVerificationCode(
            {
                usuario: this.usuario,
                medioContacto: this.verificationChannel === 'email' ? 'correo' : 'telegram',
                captchaId: this.captchaId,
                captchaRespuesta: this.captchaRespuesta
            },
            this.activationToken
        ).pipe(
            finalize(() => {
                this.sendingCode = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                this.codeSent = true;
                this.errorMessage = '';
                this.verificationCode = '';
                this.successMessage = response.mensaje || 'Código enviado correctamente.';
                this.loadCaptcha();
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo enviar el código.';
                this.loadCaptcha();
            }
        });
    }

    // ── Validar código ───────────────────────────────────────────────────────

    validateCode(): void {
        const code = this.verificationCode.trim();
        if (code.length < 6) return;

        this.validating = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.authFacade.verifyCode(
            {
                usuario: this.usuario,
                codigo: code,
                medioContacto: this.verificationChannel === 'email' ? 'correo' : 'telegram'
            },
            this.activationToken
        ).pipe(
            finalize(() => {
                this.validating = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                if (response.codigoVerificado) {
                    this.activationToken = '';
                    this.stopCountdown();
                    this.step = 'done';
                } else {
                    this.errorMessage = response.mensaje || 'El código no es válido.';
                    this.verificationCode = '';
                }
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo verificar el código.';
                this.verificationCode = '';
            }
        });
    }
    goBackToSendCode(): void {
        this.codeSent = false;
        this.verificationCode = '';
        this.errorMessage = '';
        this.successMessage = '';
        this.loadCaptcha();
    }
}