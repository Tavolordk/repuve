import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { LoginApiResponse, LoginFormEntity, LoginResponseEntity } from '../../domain/entities/login-form.entity';
import { CaptchaApiResponse, CaptchaEntity } from '../../domain/entities/captcha.entity';
import {
  ActivationFlowApiResponse,
  ActivationFlowRequestEntity,
  ActivationFlowResponseEntity,
  SendVerificationCodeApiResponse,
  SendVerificationCodeRequestEntity,
  SendVerificationCodeResponseEntity,
  VerifyCodeApiResponse,
  VerifyCodeRequestEntity,
  VerifyCodeResponseEntity
} from '../../domain/entities/verification.entity';
import { API_CONFIG } from '../../../../core/config/app.config';

@Injectable({
  providedIn: 'root'
})
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ACCESO}`;

  getCaptcha(): Observable<CaptchaEntity> {
    return this.http
      .get<CaptchaApiResponse>(`${this.baseUrl}/captcha`)
      .pipe(
        map((response) => {
          const imageBase64 = response?.data?.imageBase64 ?? '';
          const captchaId = response?.data?.id ?? '';
          const ttlSeconds = response?.data?.ttlSeconds ?? 0;

          return {
            captchaId,
            ttlSeconds,
            captchaImage: imageBase64.startsWith('data:image')
              ? imageBase64
              : `data:image/png;base64,${imageBase64}`
          };
        })
      );
  }

  login(form: LoginFormEntity): Observable<LoginResponseEntity> {
    return this.http
      .post<LoginApiResponse>(`${this.baseUrl}/iniciar`, form)
      .pipe(
        map((response) => {
          if (!response?.success || !response?.data?.token) {
            throw new Error(response?.mensaje || 'No se pudo validar el acceso.');
          }

          return {
            success: response.success,
            mensaje: response.mensaje,
            token: response.data.token,
            tipoToken: response.data.tipoToken,
            expiracionMinutos: response.data.expiracionMinutos,
            fechaExpiracionUtc: response.data.fechaExpiracionUtc
          };
        })
      );
  }

  /**
   * bearerToken: cuando se llama desde el flujo de activación se pasa
   * explícitamente el token recién recibido de iniciarFlujoActivacion,
   * sin depender del interceptor ni del sessionStorage.
   */
  sendVerificationCode(
    request: SendVerificationCodeRequestEntity,
    bearerToken?: string
  ): Observable<SendVerificationCodeResponseEntity> {
    const headers = bearerToken
      ? new HttpHeaders({ Authorization: `Bearer ${bearerToken}` })
      : undefined;

    return this.http
      .post<SendVerificationCodeApiResponse>(
        `${this.baseUrl}/enviarCodigo`,
        request,
        headers ? { headers } : {}
      )
      .pipe(
        map((response) => {
          if (!response?.success || !response?.data) {
            throw new Error(response?.mensaje || 'No se pudo enviar el código.');
          }

          return {
            success: response.success,
            mensaje: response.mensaje,
            usuario: response.data.usuario,
            canal: response.data.canal,
            codigoEnviado: response.data.codigoEnviado,
            // El backend regresa un token Bearer en este response (al menos
            // en el flujo generar-contrasena) que debe reusarse al invocar
            // verifyCode. Se expone tal cual al dominio; si la API no lo
            // manda (p. ej. crear-cuenta), los campos quedan undefined.
            token: response.data.token ?? null,
            tipoToken: response.data.tipoToken ?? null,
            expiracionMinutos: response.data.expiracionMinutos ?? null,
            fechaExpiracionUtc: response.data.fechaExpiracionUtc ?? null
          };
        })
      );
  }

  /**
   * bearerToken: ídem — se pasa explícitamente desde el flujo de activación.
   */
  verifyCode(
    request: VerifyCodeRequestEntity,
    bearerToken?: string
  ): Observable<VerifyCodeResponseEntity> {
    const headers = bearerToken
      ? new HttpHeaders({ Authorization: `Bearer ${bearerToken}` })
      : undefined;

    return this.http
      .post<VerifyCodeApiResponse>(
        `${this.baseUrl}/verificarCodigo`,
        request,
        headers ? { headers } : {}
      )
      .pipe(
        map((response) => {
          if (!response?.success || !response?.data) {
            throw new Error(response?.mensaje || 'No se pudo verificar el código.');
          }

          return {
            success: response.success,
            mensaje: response.mensaje,
            usuario: response.data.usuario,
            codigoVerificado: response.data.codigoVerificado,
            fechaExpiracionUtc: response.data.fechaExpiracionUtc
          };
        })
      );
  }

  startActivationFlow(
    request: ActivationFlowRequestEntity
  ): Observable<ActivationFlowResponseEntity> {
    return this.http
      .post<ActivationFlowApiResponse>(`${this.baseUrl}/iniciarFlujoActivacion`, request)
      .pipe(
        map((response) => {
          if (!response?.success || !response?.data?.token) {
            throw new Error(response?.mensaje || 'No se pudo activar la cuenta.');
          }

          return {
            success: response.success,
            mensaje: response.mensaje,
            usuario: response.data.usuario,
            token: response.data.token,
            tipoToken: response.data.tipoToken,
            expiracionMinutos: response.data.expiracionMinutos,
            fechaExpiracionUtc: response.data.fechaExpiracionUtc,
            flujoActivacionIniciado: response.data.flujoActivacionIniciado
          };
        })
      );
  }
}