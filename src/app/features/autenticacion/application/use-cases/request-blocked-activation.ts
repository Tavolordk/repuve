import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    BlockedActivationRequestEntity,
    BlockedActivationResponseEntity
} from '../../domain/entities/blocked-account.entity';
import { BlockedAccountApi } from '../../infrastructure/services/blocked-account-api';

@Injectable({
    providedIn: 'root'
})
export class RequestBlockedActivation {
    constructor(private readonly blockedAccountApi: BlockedAccountApi) { }

    execute(
        request: BlockedActivationRequestEntity
    ): Observable<BlockedActivationResponseEntity> {
        return this.blockedAccountApi.requestActivation(request);
    }
}