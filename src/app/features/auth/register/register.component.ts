import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../models/user.model';
import { SanitizerUtil } from '../../../core/utils/sanitizer.util';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: false
})
export class RegisterComponent {
  userData: RegisterRequest = {
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'guest'
  };
  
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // Validaciones básicas
    if (!this.userData.nombre || !this.userData.email || !this.userData.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    // 🔒 Validar formato de email
    if (!SanitizerUtil.isValidEmail(this.userData.email)) {
      this.errorMessage = 'El formato del email no es válido';
      return;
    }

    // 🔒 Validar formato de nombre (solo letras y espacios)
    if (!SanitizerUtil.isValidName(this.userData.nombre)) {
      this.errorMessage = 'El nombre solo puede contener letras y espacios';
      return;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.userData.password.length < 8) {
      this.errorMessage = 'La contraseña debe tener al menos 8 caracteres';
      return;
    }

    // 🔒 Sanitizar datos antes de enviar
    const sanitizedData: RegisterRequest = {
      nombre: SanitizerUtil.sanitizeInput(this.userData.nombre.trim()),
      email: SanitizerUtil.sanitizeInput(this.userData.email.toLowerCase().trim()),
      password: this.userData.password, // No sanitizar contraseña
      confirmPassword: this.userData.confirmPassword, // No sanitizar contraseña
      rol: this.userData.rol
    };

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(sanitizedData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = '¡Registro exitoso! Redirigiendo...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error de registro:', error);
        this.errorMessage = error.error?.message || error.message || 'Error al registrar usuario';
      }
    });
  }
}
