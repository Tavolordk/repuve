import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { LoginFormEntity } from '../../domain/entities/login-form.entity';
import { AuthApi } from '../services/auth-api';

@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl implements AuthRepository {
  constructor(private readonly authApi: AuthApi) { }

  validateCaptcha(captcha: string): Observable<boolean> {
    return this.authApi.validateCaptcha(captcha);
  }

  login(form: LoginFormEntity): Observable<void> {
    return this.authApi.login(form);
  }
}