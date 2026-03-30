import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetCaptcha } from '../use-cases/get-captcha';
import { Login } from '../use-cases/login';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { LoginFormEntity } from '../../domain/entities/login-form.entity';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  constructor(
    private readonly getCaptchaUseCase: GetCaptcha,
    private readonly loginUseCase: Login
  ) { }

  getCaptcha(): Observable<CaptchaEntity> {
    return this.getCaptchaUseCase.execute();
  }

  login(form: LoginFormEntity): Observable<void> {
    return this.loginUseCase.execute(form);
  }
}