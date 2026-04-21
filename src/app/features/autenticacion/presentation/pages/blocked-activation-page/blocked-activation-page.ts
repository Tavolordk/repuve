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
import { DenyReasonModalComponent } from '../../../../../shared/components/deny-reason-modal/deny-reason-modal';
import { BlockedAccountFacade } from '../../../application/facades/blocked-account-facade';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faCircleInfo, faLockOpen } from '@fortawesome/free-solid-svg-icons';

type PageStep = 'blocked-dialog' | 'form' | 'request-sent' | 'token-review' | 'done' | 'error';
@Component({
    selector: 'app-blocked-activation-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AuthShellComponent,
        BlockedAccountModalComponent,
        DenyReasonModalComponent,
        FontAwesomeModule
    ],
    templateUrl: './blocked-activation-page.html',
    styleUrl: './blocked-activation-page.scss'
})
export class BlockedActivationPageComponent implements OnInit, OnDestroy {
    private readonly facade = inject(BlockedAccountFacade);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    protected readonly faLockOpen = faLockOpen;
    protected readonly faCircleCheck = faCircleCheck;
    protected readonly faCircleInfo = faCircleInfo;

    step: PageStep = 'blocked-dialog';
    blockedModalOpen = false;
    denyModalOpen = false;

    modalTitle = 'Cuenta bloqueada';
    modalMessage = 'Tu cuenta ha sido bloqueada. Puedes solicitar la activación para recuperar el acceso.';
    modalCancelText = 'Cancelar';
    modalConfirmText = 'Activar cuenta';
    modalLoading = false;

    tokenMode = false;
    token = '';
    tokenUsuario = '';
    tokenNombreUsuario = '';
    tokenCorreoElectronico = '';
    tokenMensaje = '';
    tokenProcesado = false;
    /** JWT de sesión que devuelve el GET /reactivarCuenta. Debe enviarse como
     *  `Authorization: Bearer <sessionToken>` al POST /resolverReactivacionCuenta. */
    sessionToken = '';
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
    successMessage = '';

    private captchaSub?: Subscription;
    private countdownId: ReturnType<typeof setInterval> | null = null;
    private captchaVersion = 0;

    ngOnInit(): void {
        this.token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

        if (this.token) {
            this.tokenMode = true;
            this.blockedModalOpen = false;
            this.loadTokenReactivation();
            return;
        }

        this.tokenMode = false;
        this.step = 'blocked-dialog';
        this.blockedModalOpen = true;
    }

    ngOnDestroy(): void {
        this.captchaSub?.unsubscribe();
        this.stopCountdown();
    }

    private loadTokenReactivation(): void {
        this.blockedModalOpen = false;
        this.modalLoading = true;
        this.step = 'token-review';

        this.facade.reactivateAccount(this.token).pipe(
            timeout(15000),
            finalize(() => {
                this.modalLoading = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                this.tokenUsuario = response.usuario ?? '';
                this.tokenNombreUsuario = response.nombreUsuario ?? '';
                this.tokenCorreoElectronico = response.correoElectronico ?? '';
                this.tokenMensaje = response.mensaje ?? 'Selecciona la acción a realizar.';

                // Guardamos el JWT que devuelve el GET. Este token se usará como
                // Bearer en el POST /resolverReactivacionCuenta cuando el admin
                // haga click en Aceptar o Denegar dentro del modal.
                this.sessionToken = response.token ?? '';

                // NOTA: los flags `tokenConsumido` y `reactivacionProcesada` del
                // GET vienen en `true` desde el backend cuando el token es válido,
                // pero NO significan que el flujo esté terminado. El flujo sólo
                // termina tras el POST /resolverReactivacionCuenta. Por eso NO
                // usamos esos flags para brincar al step 'done' aquí.
                this.tokenProcesado = false;

                this.modalTitle = 'Solicitud de reactivación';
                this.modalMessage =
                    `Nombre de usuario: ${this.tokenNombreUsuario || 'N/D'}\n` +
                    `Cuenta de usuario: ${this.tokenUsuario || 'N/D'}\n` +
                    `Correo electrónico: ${this.tokenCorreoElectronico || 'N/D'}\n\n` +
                    `${this.tokenMensaje}`;

                this.modalCancelText = 'Denegar';
                this.modalConfirmText = 'Aceptar';
                this.step = 'token-review';

                this.cdr.detectChanges();
            },
            error: (error) => {
                this.blockedModalOpen = false;
                this.step = 'error';
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo consultar la reactivación de la cuenta.';
                this.cdr.detectChanges();
            }
        });
    }

    openTokenReviewModal(event?: Event): void {
        event?.stopPropagation();
        event?.preventDefault();

        if (!this.tokenUsuario || this.modalLoading) {
            return;
        }

        this.blockedModalOpen = true;
    }

    onBlockedActivate(): void {
        if (this.tokenMode) {
            this.resolveTokenReactivation(true);
            return;
        }

        this.blockedModalOpen = false;
        this.step = 'form';
        this.loadCaptcha();
    }

    onBlockedCancel(): void {
        if (this.tokenMode) {
            // En modo token, "Denegar" no envía el POST directo. Primero
            // abrimos el modal que pide el motivo de denegación (requerido
            // por el backend).
            this.blockedModalOpen = false;
            this.denyModalOpen = true;
            return;
        }

        this.blockedModalOpen = false;
        this.router.navigate(['/login'], { replaceUrl: true });
    }

    onDenyCancelled(): void {
        // El usuario canceló el modal de motivo: regresamos al modal de revisión
        // sin enviar nada al backend.
        this.denyModalOpen = false;
        this.blockedModalOpen = true;
    }

    onDenyConfirmed(motivo: string): void {
        this.resolveTokenReactivation(false, motivo);
    }

    private resolveTokenReactivation(aceptar: boolean, motivoNegacion?: string): void {
        if (!this.tokenUsuario) {
            this.step = 'error';
            this.blockedModalOpen = false;
            this.denyModalOpen = false;
            this.errorMessage = 'No se encontró el usuario para resolver la reactivación.';
            return;
        }

        this.modalLoading = true;
        // Al aceptar se muestra el modal principal con estado "Procesando..."
        // Al denegar se mantiene visible el modal de motivo con su loader propio.
        if (aceptar) {
            this.blockedModalOpen = true;
        }

        this.facade.resolveReactivation(
            {
                usuario: this.tokenUsuario,
                aceptar,
                motivoNegacion: aceptar ? undefined : motivoNegacion
            },
            this.sessionToken
        ).pipe(
            timeout(15000),
            finalize(() => {
                this.modalLoading = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                this.blockedModalOpen = false;
                this.denyModalOpen = false;
                this.step = 'done';
                this.successMessage =
                    response.mensaje ||
                    (aceptar
                        ? 'La cuenta fue reactivada correctamente.'
                        : 'La solicitud fue denegada correctamente.');
            },
            error: (error) => {
                this.blockedModalOpen = false;
                this.denyModalOpen = false;
                this.step = 'error';
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo resolver la reactivación.';
            }
        });
    }
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
                    'No se pudo enviar la solicitud de desbloqueo.';
                this.loadCaptcha();
            }
        });
    }

    goToLogin(): void {
        this.router.navigate(['/login'], { replaceUrl: true });
    }

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
    get shouldShowBlockedModal(): boolean {
        return this.blockedModalOpen;
    }
}