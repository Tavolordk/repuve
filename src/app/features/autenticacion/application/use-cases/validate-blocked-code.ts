import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ValidateBlockedCodeRequestEntity,
    ValidateBlockedCodeResponseEntity
} from '../../domain/entities/blocked-account.entity';
import { BlockedAccountApi } from '../../infrastructure/services/blocked-account-api';

@Injectable({
    providedIn: 'root'
})
export class ValidateBlockedCode {
    constructor(private readonly blockedAccountApi: BlockedAccountApi) { }

    execute(
        request: ValidateBlockedCodeRequestEntity
    ): Observable<ValidateBlockedCodeResponseEntity> {
        return this.blockedAccountApi.validateBlockedCode(request);
    }
}