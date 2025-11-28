import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { RoomService, Room } from '../../../core/services/room.service';
import { ReservationService, ReservationRequest } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Hotel } from '../../../models/hotel.model';

@Component({
  selector: 'app-hotel-detail',
  templateUrl: './hotel-detail.component.html',
  styleUrls: ['./hotel-detail.component.scss'],
  standalone: false
})
export class HotelDetailComponent implements OnInit {
  hotel: Hotel | null = null;
  rooms: Room[] = [];
  availableRooms: Room[] = [];
  loading = false;
  loadingRooms = false;
  hotelId!: number;
  
  // Búsqueda de disponibilidad
  searchDates = {
    checkin: '',
    checkout: '',
    guests: 1
  };
  searchPerformed = false;
  minDate: string = ''; // Fecha mínima (hoy) para validación @FutureOrPresent del backend
  maxDate: string = ''; // Fecha máxima (1 año adelante)

  // Reserva
  selectedRoom: Room | null = null;
  showReservationModal = false;
  reservationData: ReservationRequest = {
    habitacionId: 0,
    fechaCheckin: '',
    fechaCheckout: '',
    cantidadHuespedes: 1,
    notasEspeciales: '',
    reservaPorHoras: false,
    horaCheckin: '',
    horaCheckout: ''
  };
  reservationType: 'noche' | 'horas' = 'noche';
  submittingReservation = false;
  reservationMessage = '';
  reservationError = '';

  // Horas disponibles
  availableHours: string[] = [];
  minHoraCheckout: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hotelService: HotelService,
    private roomService: RoomService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.hotelId = +params['id'];
      if (this.hotelId) {
        this.loadHotelDetail();
        this.loadRooms();
      }
    });

    // Set minimum dates - el backend permite desde hoy (@FutureOrPresent)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yearFromNow = new Date(today);
    yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);
    
    this.minDate = today.toISOString().split('T')[0];
    this.maxDate = yearFromNow.toISOString().split('T')[0];
    this.searchDates.checkin = tomorrow.toISOString().split('T')[0];
    this.searchDates.checkout = new Date(tomorrow.getTime() + 86400000).toISOString().split('T')[0];
    
    // Generar horas disponibles (07:00 - 23:00)
    this.generateAvailableHours();
  }

  generateAvailableHours(): void {
    this.availableHours = [];
    for (let hour = 7; hour <= 23; hour++) {
      this.availableHours.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        this.availableHours.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
  }

  loadHotelDetail(): void {
    this.loading = true;
    this.hotelService.getHotelById(this.hotelId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hotel = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando hotel:', error);
        this.loading = false;
        this.router.navigate(['/hotels']);
      }
    });
  }

  loadRooms(): void {
    this.loadingRooms = true;
    this.roomService.getRoomsByHotel(this.hotelId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.rooms = response.data;
          this.availableRooms = this.rooms;
        }
        this.loadingRooms = false;
      },
      error: (error) => {
        console.error('Error cargando habitaciones:', error);
        this.loadingRooms = false;
      }
    });
  }

  searchAvailability(): void {
    if (!this.searchDates.checkin || !this.searchDates.checkout) {
      this.notificationService.warning('Por favor selecciona las fechas de entrada y salida');
      return;
    }

    this.loadingRooms = true;
    this.searchPerformed = true;
    
    this.roomService.searchAvailableRooms(
      this.hotelId,
      this.searchDates.checkin,
      this.searchDates.checkout,
      this.searchDates.guests
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.availableRooms = response.data;
          if (this.availableRooms.length > 0) {
            this.notificationService.success(`Se encontraron ${this.availableRooms.length} habitación(es) disponible(s)`);
          } else {
            this.notificationService.info('No hay habitaciones disponibles para las fechas seleccionadas');
          }
        }
        this.loadingRooms = false;
      },
      error: (error) => {
        console.error('Error buscando disponibilidad:', error);
        this.notificationService.error('Error al buscar disponibilidad. Intenta nuevamente');
        this.loadingRooms = false;
      }
    });
  }

  openReservationModal(room: Room): void {
    if (!this.authService.isAuthenticated()) {
      this.notificationService.warning('Debes iniciar sesión para hacer una reserva');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 1500);
      return;
    }

    this.selectedRoom = room;
    this.reservationType = 'noche';
    this.reservationData = {
      habitacionId: room.id,
      fechaCheckin: this.searchDates.checkin,
      fechaCheckout: this.searchDates.checkout,
      cantidadHuespedes: this.searchDates.guests,
      notasEspeciales: '',
      reservaPorHoras: false,
      horaCheckin: '14:00',
      horaCheckout: '12:00'
    };
    this.showReservationModal = true;
    this.reservationMessage = '';
    this.reservationError = '';
  }

  onReservationTypeChange(): void {
    if (this.reservationType === 'horas') {
      // Para reservas por horas, fechas deben ser el mismo día
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      this.reservationData.fechaCheckin = todayStr;
      this.reservationData.fechaCheckout = todayStr;
      this.reservationData.reservaPorHoras = true;
      this.reservationData.horaCheckin = '10:00';
      this.reservationData.horaCheckout = '18:00';
      this.updateMinCheckoutHour();
    } else {
      this.reservationData.reservaPorHoras = false;
      this.reservationData.fechaCheckin = this.searchDates.checkin;
      this.reservationData.fechaCheckout = this.searchDates.checkout;
    }
  }

  onHoraCheckinChange(): void {
    this.updateMinCheckoutHour();
  }

  updateMinCheckoutHour(): void {
    if (this.reservationData.horaCheckin) {
      const [hours, minutes] = this.reservationData.horaCheckin.split(':').map(Number);
      const minCheckoutDate = new Date(2000, 0, 1, hours + 3, minutes); // Mínimo 3 horas
      this.minHoraCheckout = `${minCheckoutDate.getHours().toString().padStart(2, '0')}:${minCheckoutDate.getMinutes().toString().padStart(2, '0')}`;
      
      // Si checkout actual es menor que el mínimo, ajustar
      if (this.reservationData.horaCheckout && this.reservationData.horaCheckout < this.minHoraCheckout) {
        this.reservationData.horaCheckout = this.minHoraCheckout;
      }
    }
  }

  getHoursDuration(): number {
    if (!this.reservationData.horaCheckin || !this.reservationData.horaCheckout) {
      return 0;
    }
    const [inHours, inMinutes] = this.reservationData.horaCheckin.split(':').map(Number);
    const [outHours, outMinutes] = this.reservationData.horaCheckout.split(':').map(Number);
    const inDate = new Date(2000, 0, 1, inHours, inMinutes);
    const outDate = new Date(2000, 0, 1, outHours, outMinutes);
    return Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60) * 10) / 10;
  }

  closeReservationModal(): void {
    this.showReservationModal = false;
    this.selectedRoom = null;
  }

  calculateNights(): number {
    if (!this.reservationData.fechaCheckin || !this.reservationData.fechaCheckout) {
      return 0;
    }
    const checkin = new Date(this.reservationData.fechaCheckin);
    const checkout = new Date(this.reservationData.fechaCheckout);
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  calculateTotal(): number {
    if (!this.selectedRoom) return 0;
    
    if (this.reservationType === 'horas') {
      const hours = this.getHoursDuration();
      const baseHourlyPrice = this.selectedRoom.precioBase * 0.40; // 40% del precio base por hora
      const subtotal = baseHourlyPrice * hours;
      const withTax = subtotal * 1.18; // + 18% impuestos
      return Math.round(withTax);
    } else {
      const nights = this.calculateNights();
      const subtotal = nights * this.selectedRoom.precioBase;
      const withTax = subtotal * 1.18;
      return Math.round(withTax);
    }
  }

  submitReservation(): void {
    // Evitar doble envío
    if (this.submittingReservation) {
      return;
    }

    // Validaciones básicas
    if (!this.reservationData.fechaCheckin || !this.reservationData.fechaCheckout) {
      this.notificationService.error('Por favor completa las fechas de tu estadía');
      return;
    }

    if (this.reservationType === 'horas') {
      // Validar que existan las horas
      if (!this.reservationData.horaCheckin || !this.reservationData.horaCheckout) {
        this.notificationService.error('Por favor selecciona las horas de entrada y salida');
        return;
      }
      
      const hours = this.getHoursDuration();
      
      if (hours < 3) {
        this.notificationService.error('La reserva por horas debe ser de mínimo 3 horas');
        return;
      }
      if (hours > 12) {
        this.notificationService.error('La reserva por horas tiene un máximo de 12 horas');
        return;
      }
      
      // Asegurar que horaCheckin y horaCheckout tengan formato correcto HH:mm:ss
      if (!this.reservationData.horaCheckin.includes(':00')) {
        this.reservationData.horaCheckin = this.reservationData.horaCheckin + ':00';
      }
      if (!this.reservationData.horaCheckout.includes(':00')) {
        this.reservationData.horaCheckout = this.reservationData.horaCheckout + ':00';
      }
    }

    this.submittingReservation = true;
    this.reservationError = '';
    
    this.reservationService.createReservation(this.reservationData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationService.success('¡Reserva creada exitosamente! 🎉 Redirigiendo al pago...');
          setTimeout(() => {
            this.closeReservationModal();
            this.router.navigate(['/user/payment', response.data.id]);
          }, 1500);
        } else {
          this.notificationService.error('Hubo un problema al crear tu reserva. Por favor, intenta nuevamente.');
        }
        this.submittingReservation = false;
      },
      error: (error) => {
        this.submittingReservation = false;
        
        // Mensajes amigables según el tipo de error
        const errorMessage = error.error?.message || error.message || '';
        
        if (error.status === 0) {
          this.notificationService.error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        } else if (error.status === 401) {
          this.notificationService.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2000);
        } else if (error.status === 400) {
          if (errorMessage.includes('disponible') || errorMessage.includes('ocupada')) {
            this.notificationService.error('Lo sentimos, esta habitación ya no está disponible para las fechas seleccionadas. Por favor, elige otras fechas.');
          } else if (errorMessage.includes('fecha')) {
            this.notificationService.error('Las fechas seleccionadas no son válidas. Por favor, verifica e intenta nuevamente.');
          } else {
            this.notificationService.error(errorMessage || 'Datos de reserva inválidos. Por favor, verifica la información.');
          }
        } else if (error.status === 404) {
          this.notificationService.error('La habitación seleccionada no está disponible. Por favor, intenta con otra.');
          setTimeout(() => {
            this.closeReservationModal();
          }, 2000);
        } else if (error.status === 500) {
          this.notificationService.error('Error en el servidor. Por favor, intenta nuevamente en unos momentos.');
        } else {
          this.notificationService.error(errorMessage || 'Ocurrió un error al crear tu reserva. Por favor, intenta nuevamente.');
        }
      }
    });
  }

  getStarsArray(stars: number): number[] {
    return Array(stars).fill(0);
  }

  getRoomType(room: Room): { nombre: string; descripcion: string } {
    const type = room.roomType || room.tipoHabitacion;
    return type || { nombre: 'N/A', descripcion: '' };
  }

  goBack(): void {
    this.router.navigate(['/hotels']);
  }
}
