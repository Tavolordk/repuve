import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    OnInit,
    inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { BlockedAccountFacade } from '../../../application/facades/blocked-account-facade';
import { ActivationSolicitudEntity } from '../../../domain/entities/blocked-account.entity';

@Component({
    selector: 'app-admin-activation-requests',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './admin-activation-requests.html',
    styleUrl: './admin-activation-requests.scss'
})
export class AdminActivationRequestsComponent implements OnInit {
    private readonly facade = inject(BlockedAccountFacade);
    private readonly cdr = inject(ChangeDetectorRef);

    solicitudes: ActivationSolicitudEntity[] = [];
    loading = false;
    errorMessage = '';
    successMessage = '';

    /* ── Modal de denegación ──────────────────────────────────────── */
    denyModalOpen = false;
    denyReason = '';
    denySolicitudId = '';
    denySolicitudUsuario = '';
    processingDeny = false;

    /* ── Procesando aceptación ────────────────────────────────────── */
    processingAcceptId = '';

    ngOnInit(): void {
        this.loadSolicitudes();
    }

    loadSolicitudes(): void {
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.facade.getActivationRequests().pipe(
            timeout(15000),
            finalize(() => {
                this.loading = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                this.solicitudes = response.solicitudes;
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudieron cargar las solicitudes.';
            }
        });
    }

    /* ── Aceptar solicitud (Paso 5b) ─────────────────────────────── */

    acceptRequest(solicitud: ActivationSolicitudEntity): void {
        if (this.processingAcceptId) return;

        this.processingAcceptId = solicitud.solicitudId;
        this.errorMessage = '';
        this.successMessage = '';

        this.facade.processActivationRequest({
            solicitudId: solicitud.solicitudId,
            accion: 'aceptar'
        }).pipe(
            timeout(15000),
            finalize(() => {
                this.processingAcceptId = '';
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                this.successMessage =
                    response.mensaje ||
                    `La cuenta de ${solicitud.usuario} ha sido activada. Se envió el código de verificación al correo registrado.`;
                solicitud.estado = 'aceptada';
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo aceptar la solicitud.';
            }
        });
    }

    /* ── Denegar solicitud (Pasos 5a) ────────────────────────────── */

    openDenyModal(solicitud: ActivationSolicitudEntity): void {
        this.denySolicitudId = solicitud.solicitudId;
        this.denySolicitudUsuario = solicitud.usuario;
        this.denyReason = '';
        this.denyModalOpen = true;
    }

    closeDenyModal(): void {
        this.denyModalOpen = false;
        this.denyReason = '';
        this.denySolicitudId = '';
        this.denySolicitudUsuario = '';
    }

    confirmDeny(): void {
        if (this.processingDeny || !this.denyReason.trim()) return;

        this.processingDeny = true;
        this.errorMessage = '';
        this.successMessage = '';

        this.facade.processActivationRequest({
            solicitudId: this.denySolicitudId,
            accion: 'denegar',
            motivoDenegacion: this.denyReason.trim()
        }).pipe(
            timeout(15000),
            finalize(() => {
                this.processingDeny = false;
                this.cdr.detectChanges();
            })
        ).subscribe({
            next: (response) => {
                this.successMessage =
                    response.mensaje ||
                    `La solicitud de ${this.denySolicitudUsuario} ha sido denegada. Se notificó al usuario por correo.`;

                const target = this.solicitudes.find(s => s.solicitudId === this.denySolicitudId);
                if (target) target.estado = 'denegada';

                this.closeDenyModal();
            },
            error: (error) => {
                this.errorMessage =
                    error?.error?.mensaje ||
                    error?.message ||
                    'No se pudo denegar la solicitud.';
            }
        });
    }

    get pendientes(): ActivationSolicitudEntity[] {
        return this.solicitudes.filter(s => s.estado === 'pendiente');
    }

    get procesadas(): ActivationSolicitudEntity[] {
        return this.solicitudes.filter(s => s.estado !== 'pendiente');
    }
}