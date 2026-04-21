import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ResolveReactivationRequestEntity,
    ResolveReactivationResponseEntity
} from '../../domain/entities/blocked-account.entity';
import { BlockedAccountApi } from '../../infrastructure/services/blocked-account-api';

@Injectable({
    providedIn: 'root'
})
export class ResolveReactivationAccount {
    constructor(private readonly blockedAccountApi: BlockedAccountApi) { }

    execute(
        request: ResolveReactivationRequestEntity,
        sessionToken?: string
    ): Observable<ResolveReactivationResponseEntity> {
        return this.blockedAccountApi.resolveReactivation(request, sessionToken);
    }
}