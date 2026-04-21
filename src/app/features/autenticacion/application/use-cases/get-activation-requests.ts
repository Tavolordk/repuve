import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivationSolicitudesResponseEntity } from '../../domain/entities/blocked-account.entity';
import { BlockedAccountApi } from '../../infrastructure/services/blocked-account-api';

@Injectable({
    providedIn: 'root'
})
export class GetActivationRequests {
    constructor(private readonly blockedAccountApi: BlockedAccountApi) { }

    execute(bearerToken?: string): Observable<ActivationSolicitudesResponseEntity> {
        return this.blockedAccountApi.getActivationRequests(bearerToken);
    }
}