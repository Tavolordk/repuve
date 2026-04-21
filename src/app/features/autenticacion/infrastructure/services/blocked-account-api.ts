import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_CONFIG } from '../../../../core/config/app.config';
import {
    BlockedActivationApiResponse,
    BlockedActivationRequestEntity,
    BlockedActivationResponseEntity,
    ReactivateAccountApiResponse,
    ReactivateAccountResponseEntity,
    ResolveReactivationApiResponse,
    ResolveReactivationRequestEntity,
    ResolveReactivationResponseEntity
} from '../../domain/entities/blocked-account.entity';

@Injectable({
    providedIn: 'root'
})
export class BlockedAccountApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ACCESO}`;

    requestActivation(
        request: BlockedActivationRequestEntity
    ): Observable<BlockedActivationResponseEntity> {
        return this.http
            .post<BlockedActivationApiResponse>(
                `${this.baseUrl}/solicitarDesbloqueo`,
                request
            )
            .pipe(
                map((response) => {
                    if (!response?.success || !response?.data) {
                        throw new Error(response?.mensaje || 'No se pudo enviar la solicitud.');
                    }

                    return {
                        success: response.success,
                        mensaje: response.mensaje,
                        usuario: response.data.usuario ?? '',
                        solicitudEnviada: response.data.solicitudEnviada ?? false
                    };
                })
            );
    }

    reactivateAccount(token: string): Observable<ReactivateAccountResponseEntity> {
        const params = new HttpParams().set('token', token);

        return this.http
            .get<ReactivateAccountApiResponse>(
                `${this.baseUrl}/reactivarCuenta`,
                { params }
            )
            .pipe(
                map((response) => {
                    if (!response?.success || !response?.data) {
                        throw new Error(response?.mensaje || 'No se pudo consultar la reactivación.');
                    }

                    return {
                        success: response.success,
                        mensaje: response.mensaje,
                        nombreUsuario: response.data.nombreUsuario ?? '',
                        usuario: response.data.usuario ?? '',
                        correoElectronico: response.data.correoElectronico ?? '',
                        token: response.data.token ?? '',
                        tipoToken: response.data.tipoToken ?? '',
                        expiracionMinutos: response.data.expiracionMinutos ?? 0,
                        fechaExpiracionUtc: response.data.fechaExpiracionUtc ?? '',
                        tokenConsumido: response.data.tokenConsumido ?? false,
                        reactivacionProcesada: response.data.reactivacionProcesada ?? false
                    };
                })
            );
    }

    resolveReactivation(
        request: ResolveReactivationRequestEntity,
        sessionToken?: string
    ): Observable<ResolveReactivationResponseEntity> {
        const headers = sessionToken
            ? new HttpHeaders({ Authorization: `Bearer ${sessionToken}` })
            : undefined;

        return this.http
            .post<ResolveReactivationApiResponse>(
                `${this.baseUrl}/resolverReactivacionCuenta`,
                request,
                headers ? { headers } : {}
            )
            .pipe(
                map((response) => {
                    if (!response?.success || !response?.data) {
                        throw new Error(response?.mensaje || 'No se pudo resolver la reactivación.');
                    }

                    return {
                        success: response.success,
                        mensaje: response.mensaje,
                        usuario: response.data.usuario ?? '',
                        aceptado: response.data.aceptado ?? false,
                        procesado: response.data.procesado ?? false,
                        contrasenaActualizada: response.data.contrasenaActualizada ?? false,
                        motivoNegacion: response.data.motivoNegacion ?? undefined
                    };
                })
            );
    }
}