import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports:[CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  loginWithGoogle(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (response: LoginResponse) => {
        this.loading = false;

        if (response.success && response.token && response.user && response.redirectTo) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          window.location.href = response.redirectTo;
        } else if (!response.success && response.requiresRegistration) {
          // Usuario no registrado (esto no debería pasar según tu flujo)
          this.errorMessage = response.message || 'Usuario no registrado. Contacta con un administrador.';
        } else {
          this.errorMessage = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión';
        console.error('Login error:', error);
      }
    });
  }
}