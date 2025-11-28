import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../models/user.model';
import { SanitizerUtil } from '../../../core/utils/sanitizer.util';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };
  
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    // 🔒 Validar formato de email
    if (!SanitizerUtil.isValidEmail(this.credentials.email)) {
      this.errorMessage = 'El formato del email no es válido';
      return;
    }

    // 🔒 Sanitizar inputs antes de enviar al backend
    const sanitizedCredentials: LoginRequest = {
      email: SanitizerUtil.sanitizeInput(this.credentials.email.toLowerCase().trim()),
      password: this.credentials.password // No sanitizar la contraseña, podría contener caracteres especiales válidos
    };

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(sanitizedCredentials).subscribe({
      next: (response) => {
        console.log('Respuesta login:', response);
        this.loading = false;
        if (response.success && response.data) {
          // response.data ES AuthResponse, que ya contiene los datos del usuario
          const authData = response.data;
          console.log('Usuario logueado:', authData);
          // Redirigir según el rol
          if (authData.rol === 'admin') {
            this.router.navigate(['/admin']);
          } else if (authData.rol === 'host') {
            this.router.navigate(['/host']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.errorMessage = response.message || 'Error al iniciar sesión';
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión';
      }
    });
  }
}
