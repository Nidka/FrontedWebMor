import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response.model';

export interface Reservation {
  id: number;
  codigoReserva: string;
  fechaCheckin: string;
  fechaCheckout: string;
  cantidadHuespedes: number;
  numeroNoches?: number;
  estado: string; // pendiente, confirmada, cancelada, completada
  subtotal?: number;
  impuestos?: number;
  total: number;
  precioTotal?: number; // Alias por compatibilidad
  notasEspeciales?: string;
  puedeCancelarse?: boolean;
  fechaCancelacion?: string;
  motivoCancelacion?: string;
  habitacion: {
    id: number;
    numero: string;
    nombreCompleto?: string;
    nombreCorto?: string;
    imagenPrincipal?: string;
    precioBase?: number;
  };
  hotel: {
    id: number;
    nombre: string;
    direccion: string | {
      ciudad: string;
      pais: string;
      calle?: string;
    };
    telefono?: string;
    imagenPrincipal?: string;
  };
  usuario: {
    id: number;
    nombre: string;
    email: string;
    telefono?: string;
  };
  creadoEn: string;
  actualizadoEn?: string;
}

export interface ReservationRequest {
  habitacionId: number;
  fechaCheckin: string; // ISO format: YYYY-MM-DD
  fechaCheckout: string;
  cantidadHuespedes: number; // El backend espera cantidadHuespedes, no huespedes
  notasEspeciales?: string;
  reservaPorHoras?: boolean; // Para reservas de día (day use)
  horaCheckin?: string; // HH:mm:ss format
  horaCheckout?: string; // HH:mm:ss format
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  // Crear reserva
  createReservation(reservationData: ReservationRequest): Observable<ApiResponse<Reservation>> {
    return this.http.post<ApiResponse<Reservation>>(`${this.apiUrl}/reservas`, reservationData);
  }

  // Obtener una reserva por ID
  getReservationById(id: number): Observable<ApiResponse<Reservation>> {
    return this.http.get<ApiResponse<Reservation>>(`${this.apiUrl}/reservas/${id}`);
  }

  // Buscar reserva por código
  getReservationByCode(codigo: string): Observable<ApiResponse<Reservation>> {
    return this.http.get<ApiResponse<Reservation>>(`${this.apiUrl}/reservas/codigo/${codigo}`);
  }

  // Obtener mis reservas (usuario autenticado)
  getMyReservations(page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<Reservation>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PageResponse<Reservation>>>(`${this.apiUrl}/reservas/mis-reservas`, { params });
  }

  // Obtener reservas activas del usuario
  getActiveReservations(): Observable<ApiResponse<Reservation[]>> {
    return this.http.get<ApiResponse<Reservation[]>>(`${this.apiUrl}/reservas/activas`);
  }

  // Obtener reservas de un hotel (para propietario)
  getReservationsByHotel(hotelId: number, page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<Reservation>>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<PageResponse<Reservation>>>(`${this.apiUrl}/reservas/hotel/${hotelId}`, { params });
  }

  // Obtener todas las reservas de todos los hoteles del anfitrión
  getAllMyHotelsReservations(page: number = 0, size: number = 20): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/host/reservas`, { params });
  }

  // Obtener estadísticas de reservas para el dashboard
  getReservationStats(hotelId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/reservas/hotel/${hotelId}/stats`);
  }

  // Obtener resumen de reservas de todos los hoteles del anfitrión (para badges)
  getHostReservationsSummary(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/host/reservas/resumen`);
  }

  // Confirmar reserva (host/admin)
  confirmReservation(id: number): Observable<ApiResponse<Reservation>> {
    return this.http.patch<ApiResponse<Reservation>>(`${this.apiUrl}/reservas/${id}/confirmar`, {});
  }

  // Cancelar reserva
  cancelReservation(id: number, motivo?: string): Observable<ApiResponse<Reservation>> {
    let params = new HttpParams();
    if (motivo) {
      params = params.set('motivo', motivo);
    }
    return this.http.patch<ApiResponse<Reservation>>(`${this.apiUrl}/reservas/${id}/cancelar`, {}, { params });
  }

  // Completar reserva (host/admin)
  completeReservation(id: number): Observable<ApiResponse<Reservation>> {
    return this.http.patch<ApiResponse<Reservation>>(`${this.apiUrl}/reservas/${id}/completar`, {});
  }
}
