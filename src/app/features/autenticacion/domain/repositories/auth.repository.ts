import { Observable } from 'rxjs';
import { CaptchaEntity } from '../entities/captcha.entity';
import { LoginFormEntity, LoginResponseEntity } from '../entities/login-form.entity';
import {
    ActivationFlowRequestEntity,
    ActivationFlowResponseEntity,
    SendVerificationCodeRequestEntity,
    SendVerificationCodeResponseEntity,
    VerifyCodeRequestEntity,
    VerifyCodeResponseEntity
} from '../entities/verification.entity';

export abstract class AuthRepository {
    abstract getCaptcha(): Observable<CaptchaEntity>;
    abstract login(form: LoginFormEntity): Observable<LoginResponseEntity>;
    abstract sendVerificationCode(
        request: SendVerificationCodeRequestEntity,
        bearerToken?: string
    ): Observable<SendVerificationCodeResponseEntity>;
    abstract verifyCode(
        request: VerifyCodeRequestEntity,
        bearerToken?: string
    ): Observable<VerifyCodeResponseEntity>;
    abstract startActivationFlow(
        request: ActivationFlowRequestEntity
    ): Observable<ActivationFlowResponseEntity>;
}