import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { Hotel } from '../../../models/hotel.model';
import { NotificationService } from '../../../core/services/notification.service';
import { SanitizerUtil } from '../../../core/utils/sanitizer.util';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit {
  featuredHotels: Hotel[] = [];
  searchCity = '';
  loading = true;
  gettingLocation = false;

  constructor(
    private hotelService: HotelService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadFeaturedHotels();
  }

  loadFeaturedHotels(): void {
    this.loading = true;
    console.log('🔍 Cargando hoteles destacados...');
    
    this.hotelService.searchHotels({ 
      page: 0, 
      size: 6, 
      sortBy: 'puntuacionPromedio', 
      sortDirection: 'DESC' 
    }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);
        if (response.success && response.data) {
          this.featuredHotels = response.data.content;
          console.log('🏨 Hoteles cargados:', this.featuredHotels);
        } else {
          console.warn('⚠️ Respuesta sin éxito o sin datos:', response);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar hoteles:', error);
        console.error('Error status:', error.status);
        console.error('Error message:', error.message);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    if (this.searchCity) {
      // 🔒 Sanitizar entrada del usuario para prevenir XSS
      const sanitizedCity = SanitizerUtil.sanitizeInput(this.searchCity);
      
      // Validar que no contenga patrones SQL peligrosos
      if (!SanitizerUtil.isSafeSqlInput(sanitizedCity)) {
        this.notificationService.error('La búsqueda contiene caracteres no permitidos');
        return;
      }

      // Limitar longitud máxima
      const truncatedCity = SanitizerUtil.truncate(sanitizedCity, 100);
      
      this.router.navigate(['/hotels'], { 
        queryParams: { ciudad: truncatedCity }
      });
    } else {
      this.router.navigate(['/hotels']);
    }
  }

  viewHotel(id: number): void {
    this.router.navigate(['/hotels', id]);
  }

  /**
   * Busca hoteles por número de estrellas
   */
  searchByStars(stars: number): void {
    this.router.navigate(['/hotels'], { 
      queryParams: { estrellas: stars }
    });
  }

  /**
   * Navega a la página de todos los hoteles sin filtros
   */
  viewAllHotels(): void {
    this.router.navigate(['/hotels']);
  }

  /**
   * Usa la geolocalización del navegador para obtener la ciudad actual del usuario
   * y buscar hoteles cercanos mediante OpenStreetMap Nominatim
   */
  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.notificationService.error('Tu navegador no soporta geolocalización');
      return;
    }

    this.gettingLocation = true;
    this.notificationService.info('Obteniendo tu ubicación...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        console.log('📍 Ubicación obtenida:', { lat, lng });

        try {
          // Usar Nominatim (OpenStreetMap) para geocodificación inversa (gratuito)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'es'
              }
            }
          );
          
          const data = await response.json();
          console.log('🗺️ Datos de ubicación:', data);

          // Extraer ciudad del resultado
          const city = data.address.city || 
                      data.address.town || 
                      data.address.village || 
                      data.address.municipality ||
                      data.address.county ||
                      data.address.state;

          if (city) {
            // 🔒 Sanitizar la ciudad obtenida de la API externa
            const sanitizedCity = SanitizerUtil.sanitizeInput(city);
            this.searchCity = sanitizedCity;
            this.notificationService.success(`Ubicación detectada: ${sanitizedCity}`);
            
            // Buscar automáticamente hoteles en esa ciudad
            setTimeout(() => {
              this.onSearch();
            }, 1000);
          } else {
            this.notificationService.error('No se pudo determinar tu ciudad');
          }
        } catch (error) {
          console.error('❌ Error al obtener nombre de ciudad:', error);
          this.notificationService.error('Error al procesar tu ubicación');
        } finally {
          this.gettingLocation = false;
        }
      },
      (error) => {
        console.error('❌ Error de geolocalización:', error);
        
        let errorMessage = 'No se pudo obtener tu ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Debes permitir el acceso a tu ubicación';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'La información de ubicación no está disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'El tiempo de espera se agotó';
            break;
        }
        
        this.notificationService.error(errorMessage);
        this.gettingLocation = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }
}
