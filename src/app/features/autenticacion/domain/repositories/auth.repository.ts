import { Observable } from 'rxjs';
import { CaptchaEntity } from '../entities/captcha.entity';
import { LoginFormEntity, LoginResponseEntity } from '../entities/login-form.entity';

export abstract class AuthRepository {
    abstract getCaptcha(): Observable<CaptchaEntity>;
    abstract login(form: LoginFormEntity): Observable<LoginResponseEntity>;
}