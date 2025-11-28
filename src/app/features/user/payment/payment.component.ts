import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoService } from '../../../core/services/pago.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { NotificationService } from '../../../core/services/notification.service';

declare var Culqi: any;

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  standalone: false
})
export class PaymentComponent implements OnInit {
  reservationId!: number;
  reservation: any = null;
  loading = false;
  processing = false;
  
  // Datos de pago
  paymentData = {
    cardNumber: '',
    expirationMonth: '',
    expirationYear: '',
    cvv: '',
    email: ''
  };

  // Culqi loaded
  culqiLoaded = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagoService: PagoService,
    private reservationService: ReservationService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Obtener reservationId de la URL
    this.route.params.subscribe(params => {
      this.reservationId = +params['id'];
      if (this.reservationId) {
        this.loadReservation();
        this.loadCulqiScript();
      }
    });
  }

  loadReservation(): void {
    this.loading = true;
    this.reservationService.getReservationById(this.reservationId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reservation = response.data;
          
          // Verificar si ya está pagada
          if (this.reservation.estadoPago === 'PAGADO') {
            this.notificationService.info('Esta reserva ya fue pagada');
            setTimeout(() => {
              this.router.navigate(['/user/reservations']);
            }, 2000);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando reserva:', error);
        this.notificationService.error('No se pudo cargar la reserva');
        this.loading = false;
        setTimeout(() => {
          this.router.navigate(['/user/reservations']);
        }, 2000);
      }
    });
  }

  loadCulqiScript(): void {
    // Cargar Culqi.js dinámicamente
    if (typeof Culqi !== 'undefined' && Culqi) {
      this.culqiLoaded = true;
      this.configureCulqi();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.culqi.com/js/v4';
    script.async = true;
    
    script.onload = () => {
      // Esperar a que Culqi esté completamente cargado
      setTimeout(() => {
        if (typeof Culqi !== 'undefined' && Culqi && typeof Culqi.publicKey !== 'undefined') {
          this.culqiLoaded = true;
          this.configureCulqi();
        } else {
          this.notificationService.warning('El sistema de pagos se está cargando. Por favor, espera un momento...');
          // Reintentar después de 2 segundos
          setTimeout(() => {
            if (typeof Culqi !== 'undefined' && Culqi) {
              this.culqiLoaded = true;
              this.configureCulqi();
            } else {
              this.notificationService.error('No se pudo cargar el sistema de pagos. Por favor, recarga la página.');
            }
          }, 2000);
        }
      }, 500);
    };
    
    script.onerror = () => {
      console.error('Error cargando Culqi.js');
      this.notificationService.error('No se pudo conectar con el sistema de pagos. Por favor, verifica tu conexión a internet e intenta nuevamente.');
    };
    
    document.head.appendChild(script);
  }

  configureCulqi(): void {
    if (typeof Culqi === 'undefined') return;

    // Configurar Culqi con tu Public Key
    Culqi.publicKey = 'pk_test_f4be1e6b8f455e9f'; // Reemplazar con tu clave pública real
    
    Culqi.settings({
      title: 'Hotel Booking',
      currency: 'PEN',
      description: `Reserva ${this.reservation?.codigoReserva || ''}`,
    });

    // Callback cuando Culqi genera el token
    Culqi.options({
      lang: 'es',
      modal: true,
      installments: false
    });
  }

  processPayment(): void {
    // Validar datos
    if (!this.validatePaymentData()) {
      return;
    }

    this.processing = true;

    // Verificar que Culqi esté cargado correctamente
    if (typeof Culqi === 'undefined' || !Culqi) {
      this.notificationService.error('El sistema de pagos no está disponible. Por favor, recarga la página e intenta nuevamente.');
      this.processing = false;
      return;
    }

    // Verificar que createToken exista
    if (typeof Culqi.createToken !== 'function') {
      this.notificationService.error('El sistema de pagos no se cargó correctamente. Por favor, recarga la página.');
      this.processing = false;
      return;
    }

    try {
      // Configurar los datos de la tarjeta para Culqi
      Culqi.settings({
        title: 'Hotel Booking',
        currency: 'PEN',
        description: `Reserva ${this.reservation?.codigoReserva || ''}`,
        amount: Math.round(this.getTotalAmount() * 100) // Culqi usa centavos
      });

      // Callback cuando Culqi genera el token exitosamente
      (window as any).culqi = () => {
        if (Culqi.token) {
          this.sendPaymentToBackend(Culqi.token.id);
        } else if (Culqi.error) {
          const errorMessage = Culqi.error.user_message || 'Hubo un problema al procesar tu tarjeta. Por favor, verifica los datos e intenta nuevamente.';
          this.notificationService.error(errorMessage);
          this.processing = false;
        } else {
          this.notificationService.error('Error inesperado. Por favor, intenta nuevamente.');
          this.processing = false;
        }
      };

      // Crear el token
      Culqi.createToken();
      
    } catch (error: any) {
      console.error('Error al procesar el pago:', error);
      this.notificationService.error('Ocurrió un error al procesar tu pago. Por favor, intenta nuevamente o contacta con soporte.');
      this.processing = false;
    }
  }

  sendPaymentToBackend(tokenId: string): void {
    const pagoRequest = {
      reservaId: this.reservationId,
      monto: this.getTotalAmount(),
      moneda: 'PEN',
      metodo: 'TARJETA',
      culqiToken: tokenId,
      email: this.paymentData.email,
      descripcion: `Pago de reserva ${this.reservation?.codigoReserva}`
    };

    this.pagoService.procesarPago(pagoRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('¡Pago procesado exitosamente!');
          setTimeout(() => {
            this.router.navigate(['/user/reservations']);
          }, 2000);
        } else {
          this.notificationService.error(response.message || 'Error al procesar el pago');
        }
        this.processing = false;
      },
      error: (error) => {
        console.error('Error procesando pago:', error);
        this.notificationService.error(error.error?.message || 'Error al procesar el pago');
        this.processing = false;
      }
    });
  }

  validatePaymentData(): boolean {
    // Validar número de tarjeta
    const cardNumberClean = this.paymentData.cardNumber.replace(/\s/g, '');
    if (!cardNumberClean || cardNumberClean.length < 15 || cardNumberClean.length > 16) {
      this.notificationService.error('Por favor, ingresa un número de tarjeta válido (15 o 16 dígitos)');
      return false;
    }

    // Validar que sean solo números
    if (!/^\d+$/.test(cardNumberClean)) {
      this.notificationService.error('El número de tarjeta debe contener solo números');
      return false;
    }

    // Validar mes de vencimiento
    if (!this.paymentData.expirationMonth) {
      this.notificationService.error('Por favor, selecciona el mes de vencimiento');
      return false;
    }

    // Validar año de vencimiento
    if (!this.paymentData.expirationYear) {
      this.notificationService.error('Por favor, selecciona el año de vencimiento');
      return false;
    }

    // Validar que la tarjeta no esté vencida
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const expYear = parseInt(this.paymentData.expirationYear);
    const expMonth = parseInt(this.paymentData.expirationMonth);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      this.notificationService.error('La tarjeta está vencida. Por favor, usa otra tarjeta');
      return false;
    }

    // Validar CVV
    if (!this.paymentData.cvv || (this.paymentData.cvv.length !== 3 && this.paymentData.cvv.length !== 4)) {
      this.notificationService.error('Por favor, ingresa un CVV válido (3 o 4 dígitos)');
      return false;
    }

    if (!/^\d+$/.test(this.paymentData.cvv)) {
      this.notificationService.error('El CVV debe contener solo números');
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.paymentData.email || !emailRegex.test(this.paymentData.email)) {
      this.notificationService.error('Por favor, ingresa un email válido');
      return false;
    }

    return true;
  }

  getTotalAmount(): number {
    return this.reservation?.total || this.reservation?.precioTotal || 0;
  }

  formatCardNumber(event: any): void {
    // Remover todo excepto números
    let value = event.target.value.replace(/\D/g, '');
    
    // Limitar a 16 dígitos
    value = value.substring(0, 16);
    
    // Formatear en grupos de 4
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    this.paymentData.cardNumber = formatted;
    
    // Actualizar el valor en el input
    event.target.value = formatted;
  }

  onCvvInput(event: any): void {
    // Solo permitir números en CVV
    let value = event.target.value.replace(/\D/g, '');
    this.paymentData.cvv = value.substring(0, 4);
    event.target.value = this.paymentData.cvv;
  }

  goBack(): void {
    this.router.navigate(['/user/reservations']);
  }

  getHotelName(): string {
    return this.reservation?.hotel?.nombre || 'N/A';
  }

  getRoomName(): string {
    if (!this.reservation?.habitacion) return 'N/A';
    return this.reservation.habitacion.nombreCompleto || 
           this.reservation.habitacion.nombreCorto || 
           `Hab. ${this.reservation.habitacion.numero}`;
  }

  calculateNights(): number {
    if (!this.reservation) return 0;
    const checkin = new Date(this.reservation.fechaCheckin);
    const checkout = new Date(this.reservation.fechaCheckout);
    const diff = checkout.getTime() - checkin.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
