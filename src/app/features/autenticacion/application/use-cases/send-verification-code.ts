import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import {
    SendVerificationCodeRequestEntity,
    SendVerificationCodeResponseEntity
} from '../../domain/entities/verification.entity';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth-repository-impl';

@Injectable({
    providedIn: 'root'
})
export class SendVerificationCode {
    private readonly repository: AuthRepository;

    constructor(private readonly authRepositoryImpl: AuthRepositoryImpl) {
        this.repository = authRepositoryImpl;
    }

    execute(
        request: SendVerificationCodeRequestEntity,
        bearerToken?: string
    ): Observable<SendVerificationCodeResponseEntity> {
        return this.repository.sendVerificationCode(request, bearerToken);
    }
}