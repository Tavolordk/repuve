import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthShellComponent } from '../../../../../shared/layouts/auth-shell/auth-shell.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, AuthShellComponent],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginComponent {
  model = {
    username: '',
    email: '',
    phone: '',
    captchaCode: ''
  };

  captchaImageSrc = 'images/captcha-demo.png';

  refreshCaptcha(): void {
    this.captchaImageSrc = `images/captcha-demo.png?ts=${Date.now()}`;
  }

  validateCaptcha(): void {
    console.log('Validando captcha', this.model.captchaCode);
  }

  submit(): void {
    console.log('Login payload', this.model);
  }
}