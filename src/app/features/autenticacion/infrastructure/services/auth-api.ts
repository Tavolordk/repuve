import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { LoginFormEntity } from '../../domain/entities/login-form.entity';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { API_CONFIG } from '../../../../core/config/app.config';

type CaptchaApiResponse = {
  captchaId: string;
  captchaImage: string;
};

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
        map((response) => ({
          captchaId: response.captchaId,
          captchaImage: response.captchaImage?.startsWith('data:image')
            ? response.captchaImage
            : `data:image/png;base64,${response.captchaImage}`
        }))
      );
  }

  login(form: LoginFormEntity): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/iniciar`, form);
  }
}