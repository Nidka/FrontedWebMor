import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../../models/user.model';
import { ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setSession(response.data);
          }
        })
      );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    console.log('Enviando registro a:', `${this.API_URL}/register`);
    console.log('Datos:', data);
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, data)
      .pipe(
        tap(response => {
          console.log('Respuesta del servidor:', response);
          if (response.success) {
            this.setSession(response.data);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verificar si el token ha expirado
    return !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Verifica si el token JWT ha expirado
   */
  private isTokenExpired(token: string): boolean {
    try {
      // Decodificar el payload del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si tiene fecha de expiración
      if (!payload.exp) return false;
      
      // Comparar con la fecha actual (exp viene en segundos, Date.now() en milisegundos)
      const expirationDate = payload.exp * 1000;
      const now = Date.now();
      
      if (now >= expirationDate) {
        console.warn('🔒 Token expirado, cerrando sesión...');
        this.logout();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return true; // Si hay error, considerar token inválido
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  private setSession(authResult: AuthResponse): void {
    console.log('Guardando sesión:', authResult);
    if (authResult && authResult.token) {
      // Guardar tokens
      localStorage.setItem('accessToken', authResult.token);
      localStorage.setItem('refreshToken', authResult.refreshToken);
      
      // Crear objeto User a partir de AuthResponse
      const user: User = {
        id: authResult.id,
        nombre: authResult.nombre,
        email: authResult.email,
        rol: authResult.rol,
        verificado: authResult.verificado,
        estado: 'activo' // Asumir activo si está autenticado
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUserSubject.next(user);
      console.log('Sesión guardada correctamente');
    } else {
      console.error('Datos de autenticación inválidos:', authResult);
    }
  }

  private getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr || userStr === 'undefined') {
        return null;
      }
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user from storage:', error);
      return null;
    }
  }
}
