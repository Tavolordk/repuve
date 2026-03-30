import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth-repository-impl';

@Injectable({
    providedIn: 'root'
})
export class GetCaptcha {
    private readonly repository: AuthRepository;

    constructor(private readonly authRepositoryImpl: AuthRepositoryImpl) {
        this.repository = authRepositoryImpl;
    }

    execute(): Observable<CaptchaEntity> {
        return this.repository.getCaptcha();
    }
}