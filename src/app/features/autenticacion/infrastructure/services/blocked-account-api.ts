import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_CONFIG } from '../../../../core/config/app.config';
import {
    BlockedActivationRequestEntity,
    BlockedActivationResponseEntity,
    BlockedActivationApiResponse,
    ActivationSolicitudesResponseEntity,
    ActivationSolicitudesApiResponse,
    ProcessActivationRequestEntity,
    ProcessActivationResponseEntity,
    ProcessActivationApiResponse,
    ValidateBlockedCodeRequestEntity,
    ValidateBlockedCodeResponseEntity,
    ValidateBlockedCodeApiResponse
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
                `${this.baseUrl}/activacionBloqueada/solicitar`,
                request
            )
            .pipe(
                map((response) => {
                    if (!response?.success) {
                        throw new Error(response?.mensaje || 'No se pudo enviar la solicitud.');
                    }
                    return {
                        success: response.success,
                        mensaje: response.mensaje,
                        solicitudId: response.data?.solicitudId ?? ''
                    };
                })
            );
    }

    getActivationRequests(
        bearerToken?: string
    ): Observable<ActivationSolicitudesResponseEntity> {
        const headers = bearerToken
            ? new HttpHeaders({ Authorization: `Bearer ${bearerToken}` })
            : undefined;

        return this.http
            .get<ActivationSolicitudesApiResponse>(
                `${this.baseUrl}/activacionBloqueada/solicitudes`,
                headers ? { headers } : {}
            )
            .pipe(
                map((response) => {
                    if (!response?.success) {
                        throw new Error(response?.mensaje || 'No se pudieron obtener las solicitudes.');
                    }
                    return {
                        success: response.success,
                        mensaje: response.mensaje,
                        solicitudes: response.data?.solicitudes ?? []
                    };
                })
            );
    }

    processActivationRequest(
        request: ProcessActivationRequestEntity,
        bearerToken?: string
    ): Observable<ProcessActivationResponseEntity> {
        const headers = bearerToken
            ? new HttpHeaders({ Authorization: `Bearer ${bearerToken}` })
            : undefined;

        return this.http
            .post<ProcessActivationApiResponse>(
                `${this.baseUrl}/activacionBloqueada/procesar`,
                request,
                headers ? { headers } : {}
            )
            .pipe(
                map((response) => {
                    if (!response?.success) {
                        throw new Error(response?.mensaje || 'No se pudo procesar la solicitud.');
                    }
                    return {
                        success: response.success,
                        mensaje: response.mensaje
                    };
                })
            );
    }

    validateBlockedCode(
        request: ValidateBlockedCodeRequestEntity
    ): Observable<ValidateBlockedCodeResponseEntity> {
        return this.http
            .post<ValidateBlockedCodeApiResponse>(
                `${this.baseUrl}/activacionBloqueada/validarCodigo`,
                request
            )
            .pipe(
                map((response) => {
                    if (!response?.success || !response?.data) {
                        throw new Error(response?.mensaje || 'No se pudo validar el código.');
                    }
                    return {
                        success: response.success,
                        mensaje: response.mensaje,
                        codigoVerificado: response.data.codigoVerificado
                    };
                })
            );
    }
}