import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { LoginFormEntity, LoginResponseEntity } from '../../domain/entities/login-form.entity';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { AuthApi } from '../services/auth-api';

@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly authApi: AuthApi) { }

  getCaptcha(): Observable<CaptchaEntity> {
    return this.authApi.getCaptcha();
  }

  login(form: LoginFormEntity): Observable<LoginResponseEntity> {
    return this.authApi.login(form);
  }
}