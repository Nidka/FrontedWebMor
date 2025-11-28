import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Verificar token y expiración
    const token = this.authService.getToken();
    
    if (!token || !this.authService.isAuthenticated()) {
      console.warn('🔒 Acceso denegado: Token inválido o expirado');
      
      // Limpiar sesión si hay token expirado
      if (token) {
        this.authService.logout();
      }
      
      // Guardar la URL intentada para redirigir después del login
      const returnUrl = route.url.map(segment => segment.path).join('/');
      
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: `/${returnUrl}` }
      });
    }

    // Verificar roles si es necesario
    const requiredRole = route.data['role'];
    if (requiredRole) {
      if (!this.authService.hasRole(requiredRole)) {
        console.warn(`🔒 Acceso denegado: Se requiere rol ${requiredRole}`);
        
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          // Redirigir según el rol del usuario
          switch (currentUser.rol) {
            case 'admin':
              return this.router.createUrlTree(['/admin']);
            case 'host':
              return this.router.createUrlTree(['/host']);
            default:
              return this.router.createUrlTree(['/']);
          }
        }
        
        return this.router.createUrlTree(['/']);
      }
    }

    return true;
  }
}
