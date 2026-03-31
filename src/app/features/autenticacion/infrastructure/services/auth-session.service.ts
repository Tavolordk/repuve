import { Injectable } from '@angular/core';
import { LoginResponseEntity } from '../../domain/entities/login-form.entity';

@Injectable({
    providedIn: 'root'
})
export class AuthSessionService {
    private readonly TOKEN_KEY = 'repuve_access_token';
    private readonly TOKEN_TYPE_KEY = 'repuve_token_type';
    private readonly TOKEN_EXPIRATION_KEY = 'repuve_token_expiration_utc';

    saveSession(session: LoginResponseEntity): void {
        localStorage.setItem(this.TOKEN_KEY, session.token);
        localStorage.setItem(this.TOKEN_TYPE_KEY, session.tipoToken);
        localStorage.setItem(this.TOKEN_EXPIRATION_KEY, session.fechaExpiracionUtc);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getAuthorizationHeader(): string | null {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const type = localStorage.getItem(this.TOKEN_TYPE_KEY);

        if (!token || !type) return null;

        return `${type} ${token}`;
    }

    clearSession(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.TOKEN_TYPE_KEY);
        localStorage.removeItem(this.TOKEN_EXPIRATION_KEY);
    }
}