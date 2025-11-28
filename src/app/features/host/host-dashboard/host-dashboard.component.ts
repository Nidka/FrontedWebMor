import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { RoomService } from '../../../core/services/room.service';
import { Hotel } from '../../../models/hotel.model';
import { User } from '../../../models/user.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-host-dashboard',
  templateUrl: './host-dashboard.component.html',
  styleUrls: ['./host-dashboard.component.scss'],
  standalone: false
})
export class HostDashboardComponent implements OnInit {
  currentUser: User | null = null;
  hotels: Hotel[] = [];
  loading = false;
  
  // Estadísticas de reservas por hotel
  reservationStats: Map<number, any> = new Map();
  totalPendingReservations = 0;
  loadingStats = false;
  
  // Estadísticas de habitaciones por hotel
  roomStats: Map<number, any> = new Map();

  constructor(
    private hotelService: HotelService,
    private authService: AuthService,
    private reservationService: ReservationService,
    private roomService: RoomService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadMyHotels();
  }

  loadMyHotels(): void {
    this.loading = true;
    this.hotelService.getMyHotels().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hotels = response.data;
          // Cargar estadísticas de reservas para cada hotel
          this.loadReservationStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando hoteles:', error);
        this.loading = false;
      }
    });
  }

  loadReservationStats(): void {
    if (this.hotels.length === 0) return;

    this.loadingStats = true;
    this.totalPendingReservations = 0;

    // Crear array de observables para cargar estadísticas de cada hotel
    const statsRequests = this.hotels.map(hotel =>
      this.reservationService.getReservationsByHotel(hotel.id, 0, 100)
    );

    forkJoin(statsRequests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          if (response.success && response.data) {
            const reservations = response.data.content;
            const pendientes = reservations.filter((r: any) => r.estado === 'pendiente').length;
            const confirmadas = reservations.filter((r: any) => r.estado === 'confirmada').length;
            
            this.reservationStats.set(this.hotels[index].id, {
              total: reservations.length,
              pendientes: pendientes,
              confirmadas: confirmadas
            });

            this.totalPendingReservations += pendientes;
          }
        });
        this.loadingStats = false;
        
        // Cargar estadísticas de habitaciones después de cargar reservas
        this.loadRoomStats();
      },
      error: (error) => {
        console.error('Error cargando estadísticas de reservas:', error);
        this.loadingStats = false;
      }
    });
  }

  loadRoomStats(): void {
    if (this.hotels.length === 0) return;

    // Crear array de observables para cargar habitaciones de cada hotel
    const roomRequests = this.hotels.map(hotel =>
      this.roomService.getRoomsByHotel(hotel.id)
    );

    forkJoin(roomRequests).subscribe({
      next: (responses) => {
        responses.forEach((response, index) => {
          if (response.success && response.data) {
            const rooms = response.data;
            const disponibles = rooms.filter((r: any) => r.estado === 'disponible').length;
            const ocupadas = rooms.filter((r: any) => r.estado === 'ocupada').length;
            
            this.roomStats.set(this.hotels[index].id, {
              total: rooms.length,
              disponibles: disponibles,
              ocupadas: ocupadas
            });
          }
        });
      },
      error: (error) => {
        console.error('Error cargando estadísticas de habitaciones:', error);
      }
    });
  }

  getHotelStats(hotelId: number): any {
    return this.reservationStats.get(hotelId) || { total: 0, pendientes: 0, confirmadas: 0 };
  }

  getRoomStats(hotelId: number): any {
    return this.roomStats.get(hotelId) || { total: 0, disponibles: 0, ocupadas: 0 };
  }

  createNewHotel(): void {
    this.router.navigate(['/host/create-hotel']);
  }

  viewHotelDetail(hotelId: number): void {
    this.router.navigate(['/hotels', hotelId]);
  }

  editHotel(hotelId: number): void {
    this.router.navigate(['/host/edit-hotel', hotelId]);
  }

  deleteHotel(hotelId: number, hotelName: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el hotel "${hotelName}"?`)) {
      this.hotelService.deleteHotel(hotelId).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Hotel eliminado exitosamente');
            this.loadMyHotels();
          }
        },
        error: (error) => {
          console.error('Error eliminando hotel:', error);
          alert('Error al eliminar el hotel');
        }
      });
    }
  }

  getStatusBadgeClass(estado: string): string {
    switch (estado) {
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(estado: string): string {
    switch (estado) {
      case 'aprobado':
        return 'Aprobado';
      case 'pendiente':
        return 'Pendiente';
      case 'rechazado':
        return 'Rechazado';
      default:
        return estado;
    }
  }

  getStarsArray(stars: number): number[] {
    return Array(stars).fill(0);
  }

  manageRooms(hotelId: number): void {
    // Encontrar el hotel para verificar su estado
    const hotel = this.hotels.find(h => h.id === hotelId);
    
    if (hotel && hotel.estado === 'pendiente') {
      const continuar = confirm(
        'Este hotel aún está pendiente de aprobación por un administrador.\n\n' +
        'Puedes crear habitaciones ahora, pero no serán visibles públicamente hasta que el hotel sea aprobado.\n\n' +
        '¿Deseas continuar?'
      );
      if (!continuar) return;
    }
    
    if (hotel && hotel.estado === 'rechazado') {
      alert('Este hotel ha sido rechazado y no puede tener habitaciones. Por favor, contacta al administrador.');
      return;
    }
    
    this.router.navigate(['/host/manage-rooms', hotelId]);
  }

  viewReservations(hotelId: number): void {
    this.router.navigate(['/host/reservations', hotelId]);
  }
}
