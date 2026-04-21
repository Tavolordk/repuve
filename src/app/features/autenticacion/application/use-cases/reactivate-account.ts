import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReactivateAccountResponseEntity } from '../../domain/entities/blocked-account.entity';
import { BlockedAccountApi } from '../../infrastructure/services/blocked-account-api';

@Injectable({
    providedIn: 'root'
})
export class ReactivateAccount {
    constructor(private readonly blockedAccountApi: BlockedAccountApi) { }

    execute(token: string): Observable<ReactivateAccountResponseEntity> {
        return this.blockedAccountApi.reactivateAccount(token);
    }
}