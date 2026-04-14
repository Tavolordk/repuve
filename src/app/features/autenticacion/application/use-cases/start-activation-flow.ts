import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import {
    ActivationFlowRequestEntity,
    ActivationFlowResponseEntity
} from '../../domain/entities/verification.entity';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth-repository-impl';

@Injectable({
    providedIn: 'root'
})
export class StartActivationFlow {
    private readonly repository: AuthRepository;

    constructor(private readonly authRepositoryImpl: AuthRepositoryImpl) {
        this.repository = authRepositoryImpl;
    }

    execute(
        request: ActivationFlowRequestEntity
    ): Observable<ActivationFlowResponseEntity> {
        return this.repository.startActivationFlow(request);
    }
}