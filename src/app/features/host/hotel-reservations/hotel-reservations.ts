import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationService, Reservation, PageResponse } from '../../../core/services/reservation.service';
import { HotelService } from '../../../core/services/hotel.service';
import { Hotel } from '../../../models/hotel.model';

@Component({
  selector: 'app-hotel-reservations',
  standalone: false,
  templateUrl: './hotel-reservations.html',
  styleUrl: './hotel-reservations.scss',
})
export class HotelReservations implements OnInit {
  hotelId!: number;
  hotel: Hotel | null = null;
  reservations: Reservation[] = [];
  loading = false;
  message = '';
  error = '';
  
  // Paginación
  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // Filtros
  selectedStatus: string = 'todas';
  searchTerm: string = '';

  // Estadísticas
  stats = {
    pendientes: 0,
    confirmadas: 0,
    completadas: 0,
    canceladas: 0
  };

  // Modal de detalles
  selectedReservation: Reservation | null = null;
  showDetailsModal = false;

  // Modal de cancelación
  showCancelModal = false;
  cancelReason = '';
  canceling = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservationService: ReservationService,
    private hotelService: HotelService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.hotelId = +params['id'];
      if (this.hotelId) {
        this.loadHotel();
        this.loadReservations();
      }
    });
  }

  loadHotel(): void {
    this.hotelService.getHotelById(this.hotelId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hotel = response.data;
        }
      },
      error: (error) => {
        console.error('Error cargando hotel:', error);
        this.error = 'Error al cargar información del hotel';
      }
    });
  }

  loadReservations(): void {
    this.loading = true;
    this.error = '';

    this.reservationService.getReservationsByHotel(this.hotelId, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reservations = response.data.content;
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
          this.calculateStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.error = 'Error al cargar las reservas';
        this.loading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats = {
      pendientes: this.reservations.filter(r => r.estado === 'pendiente').length,
      confirmadas: this.reservations.filter(r => r.estado === 'confirmada').length,
      completadas: this.reservations.filter(r => r.estado === 'completada').length,
      canceladas: this.reservations.filter(r => r.estado === 'cancelada').length
    };
  }

  get filteredReservations(): Reservation[] {
    let filtered = this.reservations;

    // Filtrar por estado
    if (this.selectedStatus !== 'todas') {
      filtered = filtered.filter(r => r.estado === this.selectedStatus);
    }

    // Filtrar por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.codigoReserva.toLowerCase().includes(term) ||
        r.usuario.nombre.toLowerCase().includes(term) ||
        r.usuario.email.toLowerCase().includes(term) ||
        r.habitacion.numero.toLowerCase().includes(term)
      );
    }

    return filtered;
  }

  confirmarReserva(reservation: Reservation): void {
    if (!confirm(`¿Confirmar la reserva ${reservation.codigoReserva}?`)) {
      return;
    }

    this.reservationService.confirmReservation(reservation.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.message = 'Reserva confirmada exitosamente';
          this.loadReservations();
          setTimeout(() => this.message = '', 3000);
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al confirmar reserva';
        setTimeout(() => this.error = '', 3000);
      }
    });
  }

  completarReserva(reservation: Reservation): void {
    if (!confirm(`¿Marcar como completada la reserva ${reservation.codigoReserva}?`)) {
      return;
    }

    this.reservationService.completeReservation(reservation.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.message = 'Reserva marcada como completada';
          this.loadReservations();
          setTimeout(() => this.message = '', 3000);
        }
      },
      error: (error) => {
        this.error = error.error?.message || 'Error al completar reserva';
        setTimeout(() => this.error = '', 3000);
      }
    });
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
    this.canceling = false;
  }

  cancelarReserva(reservation: Reservation): void {
    this.canceling = true;

    this.reservationService.cancelReservation(reservation.id, this.cancelReason || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.message = '✅ Reserva cancelada exitosamente';
          this.closeCancelModal();
          this.loadReservations();
          setTimeout(() => this.message = '', 3000);
        }
        this.canceling = false;
      },
      error: (error) => {
        console.error('Error cancelando reserva:', error);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        
        // Mensajes amigables según el error
        if (errorMessage.includes('no puede ser cancelada')) {
          this.error = '❌ Esta reserva no puede ser cancelada. La fecha de check-in ya pasó o la reserva ya está completada/cancelada.';
        } else if (errorMessage.includes('permisos')) {
          this.error = '❌ No tienes permisos para cancelar esta reserva.';
        } else {
          this.error = '❌ ' + errorMessage;
        }
        
        this.canceling = false;
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  calculateNights(reservation: Reservation): number {
    const checkin = new Date(reservation.fechaCheckin);
    const checkout = new Date(reservation.fechaCheckout);
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'confirmada': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(estado: string): string {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'confirmada': return '✅';
      case 'completada': return '🎉';
      case 'cancelada': return '❌';
      default: return '📋';
    }
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadReservations();
    }
  }

  viewReservationDetails(reservation: Reservation): void {
    this.selectedReservation = reservation;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedReservation = null;
  }

  getReservationDuration(reservation: Reservation): string {
    const checkin = new Date(reservation.fechaCheckin);
    const checkout = new Date(reservation.fechaCheckout);
    const nights = this.calculateNights(reservation);
    return `${nights} noche${nights !== 1 ? 's' : ''}`;
  }

  getRoomName(reservation: Reservation): string {
    return reservation.habitacion.nombreCompleto || 
           reservation.habitacion.nombreCorto || 
           `Habitación ${reservation.habitacion.numero}`;
  }

  goBack(): void {
    this.router.navigate(['/host']);
  }
}
