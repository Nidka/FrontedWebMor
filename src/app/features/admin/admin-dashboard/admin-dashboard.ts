import { Component, OnInit } from '@angular/core';
import { HotelService } from '../../../core/services/hotel.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard implements OnInit {
  hotelesPendientes: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';

  constructor(private hotelService: HotelService) {}

  ngOnInit(): void {
    this.cargarHotelesPendientes();
  }

  cargarHotelesPendientes(): void {
    this.loading = true;
    this.errorMessage = '';

    this.hotelService.getHotelesPendientes().subscribe({
      next: (response) => {
        if (response.success) {
          this.hotelesPendientes = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando hoteles:', error);
        this.errorMessage = 'Error al cargar los hoteles pendientes';
        this.loading = false;
      }
    });
  }

  aprobarHotel(id: number): void {
    if (!confirm('¿Está seguro de aprobar este hotel?')) {
      return;
    }

    this.hotelService.aprobarHotel(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Hotel aprobado exitosamente';
          this.cargarHotelesPendientes();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        console.error('Error aprobando hotel:', error);
        this.errorMessage = 'Error al aprobar el hotel';
      }
    });
  }

  rechazarHotel(id: number): void {
    if (!confirm('¿Está seguro de rechazar este hotel?')) {
      return;
    }

    this.hotelService.rechazarHotel(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Hotel rechazado';
          this.cargarHotelesPendientes();
          setTimeout(() => this.successMessage = '', 3000);
        }
      },
      error: (error) => {
        console.error('Error rechazando hotel:', error);
        this.errorMessage = 'Error al rechazar el hotel';
      }
    });
  }

  getStarsArray(stars: number): number[] {
    return Array(stars).fill(0);
  }
}
