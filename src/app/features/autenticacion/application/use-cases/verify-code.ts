import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import {
    VerifyCodeRequestEntity,
    VerifyCodeResponseEntity
} from '../../domain/entities/verification.entity';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth-repository-impl';

@Injectable({
    providedIn: 'root'
})
export class VerifyCode {
    private readonly repository: AuthRepository;

    constructor(private readonly authRepositoryImpl: AuthRepositoryImpl) {
        this.repository = authRepositoryImpl;
    }

    execute(
        request: VerifyCodeRequestEntity,
        bearerToken?: string
    ): Observable<VerifyCodeResponseEntity> {
        return this.repository.verifyCode(request, bearerToken);
    }
}