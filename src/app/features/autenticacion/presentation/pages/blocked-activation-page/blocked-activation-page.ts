import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, finalize, timeout } from 'rxjs';

import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';
import { BlockedAccountModalComponent } from '../../../../../shared/components/blocked-account-modal/blocked-account-modal';
import { BlockedAccountFacade } from '../../../application/facades/blocked-account-facade';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faCircleInfo, faLockOpen } from '@fortawesome/free-solid-svg-icons';

type PageStep = 'blocked-dialog' | 'form' | 'request-sent';

@Component({
    selector: 'app-blocked-activation-page',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AuthShellComponent,
        BlockedAccountModalComponent,
        FontAwesomeModule
    ],
    templateUrl: './blocked-activation-page.html',
    styleUrl: './blocked-activation-page.scss'
})
export class BlockedActivationPageComponent implements OnDestroy {
    private readonly facade = inject(BlockedAccountFacade);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly router = inject(Router);

    protected readonly faLockOpen = faLockOpen;
    protected readonly faCircleCheck = faCircleCheck;
    protected readonly faCircleInfo = faCircleInfo;

    step: PageStep = 'blocked-dialog';
    blockedModalOpen = true;

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

    private captchaSub?: Subscription;
    private countdownId: ReturnType<typeof setInterval> | null = null;
    private captchaVersion = 0;

    ngOnDestroy(): void {
        this.captchaSub?.unsubscribe();
        this.stopCountdown();
    }

    onBlockedCancel(): void {
        this.blockedModalOpen = false;
        this.router.navigate(['/login'], { replaceUrl: true });
    }

    onBlockedActivate(): void {
        this.blockedModalOpen = false;
        this.step = 'form';
        this.loadCaptcha();
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
}