import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginFormEntity } from '../../domain/entities/login-form.entity';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthRepositoryImpl } from '../../infrastructure/repositories/auth-repository-impl';

@Injectable({
  providedIn: 'root'
})
export class Login {
  private readonly repository: AuthRepository;

  constructor(private readonly authRepositoryImpl: AuthRepositoryImpl) {
    this.repository = authRepositoryImpl;
  }

  execute(form: LoginFormEntity): Observable<void> {
    return this.repository.login(form);
  }
}