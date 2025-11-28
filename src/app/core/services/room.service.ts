import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response.model';

export interface Room {
  id: number;
  numero: string;
  nombreCorto: string;
  precioBase: number;
  capacidad: number;
  numCamas: number;
  metrosCuadrados: number;
  estado: string;
  roomType?: {
    id: number;
    nombre: string;
    descripcion: string;
  };
  tipoHabitacion?: {
    id: number;
    nombre: string;
    descripcion: string;
    icono?: string;
  };
  hotel?: {
    id: number;
    nombre: string;
  };
}

export interface RoomRequest {
  hotelId: number;
  numero: string;
  nombreCorto?: string;
  roomTypeId: number;
  precioBase: number;
  capacidad: number;
  numCamas: number;
  metrosCuadrados?: number;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  // Crear habitación (host)
  createRoom(roomData: RoomRequest): Observable<ApiResponse<Room>> {
    return this.http.post<ApiResponse<Room>>(`${this.apiUrl}/host/habitaciones`, roomData);
  }

  // Obtener habitaciones de un hotel (público)
  getRoomsByHotel(hotelId: number): Observable<ApiResponse<Room[]>> {
    return this.http.get<ApiResponse<Room[]>>(`${this.apiUrl}/hotels/${hotelId}/habitaciones`);
  }

  // Buscar habitaciones disponibles con fechas
  searchAvailableRooms(hotelId: number, checkin?: string, checkout?: string, guests?: number): Observable<ApiResponse<Room[]>> {
    let params = new HttpParams();
    if (checkin) params = params.set('checkin', checkin);
    if (checkout) params = params.set('checkout', checkout);
    if (guests) params = params.set('huespedes', guests.toString());

    return this.http.get<ApiResponse<Room[]>>(
      `${this.apiUrl}/hotels/${hotelId}/habitaciones/disponibles`,
      { params }
    );
  }

  // Obtener una habitación por ID
  getRoomById(id: number): Observable<ApiResponse<Room>> {
    return this.http.get<ApiResponse<Room>>(`${this.apiUrl}/habitaciones/${id}`);
  }

  // Actualizar habitación (host)
  updateRoom(id: number, roomData: RoomRequest): Observable<ApiResponse<Room>> {
    return this.http.put<ApiResponse<Room>>(`${this.apiUrl}/host/habitaciones/${id}`, roomData);
  }

  // Cambiar estado de habitación (host)
  changeRoomStatus(id: number, estado: string): Observable<ApiResponse<Room>> {
    return this.http.patch<ApiResponse<Room>>(
      `${this.apiUrl}/host/habitaciones/${id}/estado?estado=${estado}`,
      {}
    );
  }

  // Eliminar habitación (host)
  deleteRoom(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.apiUrl}/host/habitaciones/${id}`);
  }

  // Obtener estadísticas de disponibilidad de habitaciones (para dashboard)
  getRoomAvailabilityStats(hotelId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/hotels/${hotelId}/habitaciones/stats`);
  }

  // Obtener conteo de habitaciones por estado
  getRoomCountByStatus(hotelId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/host/habitaciones/hotel/${hotelId}/conteo`);
  }
}
