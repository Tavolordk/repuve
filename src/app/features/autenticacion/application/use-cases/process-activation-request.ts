import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ProcessActivationRequestEntity,
    ProcessActivationResponseEntity
} from '../../domain/entities/blocked-account.entity';
import { BlockedAccountApi } from '../../infrastructure/services/blocked-account-api';

@Injectable({
    providedIn: 'root'
})
export class ProcessActivationRequest {
    constructor(private readonly blockedAccountApi: BlockedAccountApi) { }

    execute(
        request: ProcessActivationRequestEntity,
        bearerToken?: string
    ): Observable<ProcessActivationResponseEntity> {
        return this.blockedAccountApi.processActivationRequest(request, bearerToken);
    }
}