import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Hotel, HotelSearchRequest, PageResponse } from '../../models/hotel.model';
import { ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private readonly API_URL = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  searchHotels(filters: HotelSearchRequest): Observable<ApiResponse<PageResponse<Hotel>>> {
    let params = new HttpParams();
    
    if (filters.ciudad) params = params.set('ciudad', filters.ciudad);
    if (filters.pais) params = params.set('pais', filters.pais);
    if (filters.estrellas) params = params.set('estrellas', filters.estrellas.toString());
    if (filters.precioMinimo) params = params.set('precioMinimo', filters.precioMinimo.toString());
    if (filters.precioMaximo) params = params.set('precioMaximo', filters.precioMaximo.toString());
    
    params = params.set('page', (filters.page || 0).toString());
    params = params.set('size', (filters.size || 12).toString());
    params = params.set('sortBy', filters.sortBy || 'puntuacionPromedio');
    params = params.set('sortDirection', filters.sortDirection || 'DESC');

    return this.http.get<ApiResponse<PageResponse<Hotel>>>(`${this.API_URL}/hotels`, { params });
  }

  getHotelById(id: number): Observable<ApiResponse<Hotel>> {
    return this.http.get<ApiResponse<Hotel>>(`${this.API_URL}/hotels/${id}`);
  }

  getFeaturedHotels(): Observable<ApiResponse<Hotel[]>> {
    return this.http.get<ApiResponse<Hotel[]>>(`${this.API_URL}/hotels/destacados`);
  }

  // Host endpoints
  createHotel(hotelData: any): Observable<ApiResponse<Hotel>> {
    return this.http.post<ApiResponse<Hotel>>(`${this.API_URL}/host/hotel`, hotelData);
  }

  getMyHotels(): Observable<ApiResponse<Hotel[]>> {
    return this.http.get<ApiResponse<Hotel[]>>(`${this.API_URL}/host/mis-hoteles`);
  }

  updateHotel(id: number, hotelData: any): Observable<ApiResponse<Hotel>> {
    return this.http.put<ApiResponse<Hotel>>(`${this.API_URL}/host/hotel/${id}`, hotelData);
  }

  deleteHotel(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/host/hotel/${id}`);
  }

  // Admin endpoints
  getHotelesPendientes(): Observable<ApiResponse<Hotel[]>> {
    return this.http.get<ApiResponse<Hotel[]>>(`${this.API_URL}/admin/hoteles/pendientes`);
  }

  aprobarHotel(id: number): Observable<ApiResponse<Hotel>> {
    return this.http.put<ApiResponse<Hotel>>(`${this.API_URL}/admin/hoteles/${id}/aprobar`, {});
  }

  rechazarHotel(id: number): Observable<ApiResponse<Hotel>> {
    return this.http.put<ApiResponse<Hotel>>(`${this.API_URL}/admin/hoteles/${id}/rechazar`, {});
  }
}
