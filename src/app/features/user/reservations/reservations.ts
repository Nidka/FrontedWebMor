import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReservationService, Reservation, PageResponse } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-reservations',
  standalone: false,
  templateUrl: './reservations.html',
  styleUrl: './reservations.scss',
})
export class Reservations implements OnInit {
  reservations: Reservation[] = [];
  loading = false;
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 10;

  selectedReservation: Reservation | null = null;
  showCancelModal = false;
  cancelReason = '';
  canceling = false;

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService.getMyReservations(this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reservations = response.data.content;
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
          this.currentPage = response.data.number;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadReservations();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadReservations();
    }
  }

  getStatusClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'confirmada':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'completada':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(estado: string): string {
    const statusMap: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'confirmada': 'Confirmada',
      'cancelada': 'Cancelada',
      'completada': 'Completada'
    };
    return statusMap[estado.toLowerCase()] || estado;
  }

  openCancelModal(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.showCancelModal = true;
    this.cancelReason = '';
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
    this.selectedReservation = null;
    this.cancelReason = '';
  }

  confirmCancel(): void {
    if (!this.selectedReservation) return;

    this.canceling = true;
    this.reservationService.cancelReservation(this.selectedReservation.id, this.cancelReason).subscribe({
      next: (response) => {
        if (response.success) {
          alert('✅ Reserva cancelada exitosamente');
          this.closeCancelModal();
          this.loadReservations();
        }
        this.canceling = false;
      },
      error: (error) => {
        console.error('Error cancelando reserva:', error);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        
        // Mensajes amigables según el error
        if (errorMessage.includes('no puede ser cancelada')) {
          alert('❌ Esta reserva no puede ser cancelada.\n\n' +
                'Posibles razones:\n' +
                '• La fecha de check-in ya pasó\n' +
                '• La reserva ya está completada o cancelada\n\n' +
                'Si necesitas ayuda, contacta al hotel directamente.');
        } else if (errorMessage.includes('permisos')) {
          alert('❌ No tienes permisos para cancelar esta reserva.\n\n' +
                'Solo puedes cancelar tus propias reservas.');
        } else {
          alert('❌ Error al cancelar la reserva:\n' + errorMessage);
        }
        
        this.canceling = false;
      }
    });
  }

  viewHotelDetail(hotelId: number): void {
    this.router.navigate(['/hotels', hotelId]);
  }

  goToPayment(reservationId: number): void {
    this.router.navigate(['/user/payment', reservationId]);
  }

  calculateNights(checkin: string, checkout: string): number {
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const diff = checkoutDate.getTime() - checkinDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  canCancelReservation(reservation: Reservation): boolean {
    const estado = reservation.estado.toLowerCase();
    return estado === 'pendiente' || estado === 'confirmada';
  }

  getGuestsCount(reservation: Reservation): number {
    return reservation.cantidadHuespedes || 1;
  }

  getHotelAddress(reservation: Reservation): string {
    if (!reservation.hotel || !reservation.hotel.direccion) return 'N/A';
    
    const direccion = reservation.hotel.direccion;
    if (typeof direccion === 'string') {
      return direccion;
    } else {
      return `${direccion.ciudad || ''}, ${direccion.pais || ''}`;
    }
  }

  getRoomName(reservation: Reservation): string {
    if (!reservation.habitacion) return 'N/A';
    
    return reservation.habitacion.nombreCompleto || 
           reservation.habitacion.nombreCorto || 
           `Hab. ${reservation.habitacion.numero}`;
  }

  getTotalPrice(reservation: Reservation): number {
    return reservation.total || reservation.precioTotal || 0;
  }
}
