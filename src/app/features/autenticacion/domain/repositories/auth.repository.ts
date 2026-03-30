import { Observable } from 'rxjs';
import { LoginFormEntity } from '../entities/login-form.entity';

export abstract class AuthRepository {
    abstract validateCaptcha(captcha: string): Observable<boolean>;
    abstract login(form: LoginFormEntity): Observable<void>;
}