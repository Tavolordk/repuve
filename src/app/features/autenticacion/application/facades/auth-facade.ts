import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetCaptcha } from '../use-cases/get-captcha';
import { Login } from '../use-cases/login';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { LoginFormEntity, LoginResponseEntity } from '../../domain/entities/login-form.entity';
import {
  ActivationFlowRequestEntity,
  ActivationFlowResponseEntity,
  SendVerificationCodeRequestEntity,
  SendVerificationCodeResponseEntity,
  VerifyCodeRequestEntity,
  VerifyCodeResponseEntity
} from '../../domain/entities/verification.entity';
import { SendVerificationCode } from '../use-cases/send-verification-code';
import { StartActivationFlow } from '../use-cases/start-activation-flow';
import { VerifyCode } from '../use-cases/verify-code';

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  constructor(
    private readonly getCaptchaUseCase: GetCaptcha,
    private readonly loginUseCase: Login,
    private readonly sendVerificationCodeUseCase: SendVerificationCode,
    private readonly verifyCodeUseCase: VerifyCode,
    private readonly startActivationFlowUseCase: StartActivationFlow
  ) { }

  getCaptcha(): Observable<CaptchaEntity> {
    return this.getCaptchaUseCase.execute();
  }

  login(form: LoginFormEntity): Observable<LoginResponseEntity> {
    return this.loginUseCase.execute(form);
  }

  sendVerificationCode(
    request: SendVerificationCodeRequestEntity,
    bearerToken?: string
  ): Observable<SendVerificationCodeResponseEntity> {
    return this.sendVerificationCodeUseCase.execute(request, bearerToken);
  }

  verifyCode(
    request: VerifyCodeRequestEntity,
    bearerToken?: string
  ): Observable<VerifyCodeResponseEntity> {
    return this.verifyCodeUseCase.execute(request, bearerToken);
  }

  startActivationFlow(
    request: ActivationFlowRequestEntity
  ): Observable<ActivationFlowResponseEntity> {
    return this.startActivationFlowUseCase.execute(request);
  }
}