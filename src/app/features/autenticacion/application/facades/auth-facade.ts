import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Login } from '../use-cases/login';
import { LoginFormEntity } from '../../domain/entities/login-form.entity';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth-repository-impl';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  constructor(
    private readonly loginUseCase: Login,
    private readonly authRepositoryImpl: AuthRepositoryImpl
  ) { }

  login(form: LoginFormEntity): Observable<void> {
    return this.loginUseCase.execute(form);
  }

  validateCaptcha(captcha: string): Observable<boolean> {
    return this.authRepositoryImpl.validateCaptcha(captcha);
  }
}