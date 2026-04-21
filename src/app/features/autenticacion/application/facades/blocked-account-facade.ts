import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    BlockedActivationRequestEntity,
    BlockedActivationResponseEntity,
    ReactivateAccountResponseEntity,
    ResolveReactivationRequestEntity,
    ResolveReactivationResponseEntity
} from '../../domain/entities/blocked-account.entity';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { GetCaptcha } from '../use-cases/get-captcha';
import { RequestBlockedActivation } from '../use-cases/request-blocked-activation';
import { ReactivateAccount } from '../use-cases/reactivate-account';
import { ResolveReactivationAccount } from '../use-cases/resolve-reactivation-account';

@Injectable({
    providedIn: 'root'
})
export class BlockedAccountFacade {
    constructor(
        private readonly getCaptchaUseCase: GetCaptcha,
        private readonly requestBlockedActivationUseCase: RequestBlockedActivation,
        private readonly reactivateAccountUseCase: ReactivateAccount,
        private readonly resolveReactivationAccountUseCase: ResolveReactivationAccount
    ) { }

    getCaptcha(): Observable<CaptchaEntity> {
        return this.getCaptchaUseCase.execute();
    }

    requestActivation(
        request: BlockedActivationRequestEntity
    ): Observable<BlockedActivationResponseEntity> {
        return this.requestBlockedActivationUseCase.execute(request);
    }

    reactivateAccount(token: string): Observable<ReactivateAccountResponseEntity> {
        return this.reactivateAccountUseCase.execute(token);
    }

    resolveReactivation(
        request: ResolveReactivationRequestEntity
    ): Observable<ResolveReactivationResponseEntity> {
        return this.resolveReactivationAccountUseCase.execute(request);
    }
}