export interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rol: 'guest' | 'host' | 'admin';
  estado: string;
  verificado: boolean;
  fechaUltimoAcceso?: string;
  creadoEn?: string; // Opcional, no viene en AuthResponse
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono?: string;
  rol: 'guest' | 'host';
}

export interface AuthResponse {
  token: string;         // Backend usa "token" no "accessToken"
  refreshToken: string;
  tipo: string;          // "Bearer"
  id: number;
  nombre: string;
  email: string;
  rol: 'guest' | 'host' | 'admin';
  verificado: boolean;
}
