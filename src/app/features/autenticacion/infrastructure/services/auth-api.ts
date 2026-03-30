import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { LoginFormEntity } from '../../domain/entities/login-form.entity';

@Injectable({
  providedIn: 'root'
})
export class AuthApi {
  validateCaptcha(captcha: string): Observable<boolean> {
    return of(captcha).pipe(
      delay(300),
      map(value => value.trim().length > 0)
    );
  }

  login(form: LoginFormEntity): Observable<void> {
    console.log('Mock login payload:', form);
    return of(void 0).pipe(delay(500));
  }
}