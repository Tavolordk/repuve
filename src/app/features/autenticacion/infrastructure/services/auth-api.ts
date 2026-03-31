import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { LoginApiResponse, LoginFormEntity, LoginResponseEntity } from '../../domain/entities/login-form.entity';
import { CaptchaApiResponse, CaptchaEntity } from '../../domain/entities/captcha.entity';
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
}