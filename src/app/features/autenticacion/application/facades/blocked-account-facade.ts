import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    BlockedActivationRequestEntity,
    BlockedActivationResponseEntity,
    ActivationSolicitudesResponseEntity,
    ProcessActivationRequestEntity,
    ProcessActivationResponseEntity,
    ValidateBlockedCodeRequestEntity,
    ValidateBlockedCodeResponseEntity
} from '../../domain/entities/blocked-account.entity';
import { CaptchaEntity } from '../../domain/entities/captcha.entity';
import { RequestBlockedActivation } from '../use-cases/request-blocked-activation';
import { GetActivationRequests } from '../use-cases/get-activation-requests';
import { ProcessActivationRequest } from '../use-cases/process-activation-request';
import { ValidateBlockedCode } from '../use-cases/validate-blocked-code';
import { GetCaptcha } from '../use-cases/get-captcha';

@Injectable({
    providedIn: 'root'
})
export class BlockedAccountFacade {
    constructor(
        private readonly getCaptchaUseCase: GetCaptcha,
        private readonly requestBlockedActivationUseCase: RequestBlockedActivation,
        private readonly getActivationRequestsUseCase: GetActivationRequests,
        private readonly processActivationRequestUseCase: ProcessActivationRequest,
        private readonly validateBlockedCodeUseCase: ValidateBlockedCode
    ) { }

    getCaptcha(): Observable<CaptchaEntity> {
        return this.getCaptchaUseCase.execute();
    }

    /** Etapa 2: el usuario solicita la activación de su cuenta bloqueada. */
    requestActivation(
        request: BlockedActivationRequestEntity
    ): Observable<BlockedActivationResponseEntity> {
        return this.requestBlockedActivationUseCase.execute(request);
    }

    /** Etapa 3: el administrador obtiene las solicitudes pendientes. */
    getActivationRequests(
        bearerToken?: string
    ): Observable<ActivationSolicitudesResponseEntity> {
        return this.getActivationRequestsUseCase.execute(bearerToken);
    }

    /** Etapa 3: el administrador acepta o deniega una solicitud. */
    processActivationRequest(
        request: ProcessActivationRequestEntity,
        bearerToken?: string
    ): Observable<ProcessActivationResponseEntity> {
        return this.processActivationRequestUseCase.execute(request, bearerToken);
    }

    /** Etapa 4: el usuario valida el código de verificación de 6 dígitos. */
    validateBlockedCode(
        request: ValidateBlockedCodeRequestEntity
    ): Observable<ValidateBlockedCodeResponseEntity> {
        return this.validateBlockedCodeUseCase.execute(request);
    }
}