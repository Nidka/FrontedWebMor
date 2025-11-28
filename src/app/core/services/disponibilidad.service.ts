import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class DisponibilidadService {
  private readonly apiUrl = 'http://localhost:8080/api/disponibilidad';

  constructor(private http: HttpClient) {}

  obtenerPrecios(
    habitacionId: number,
    inicio: string,
    fin: string
  ): Observable<ApiResponse<Record<string, number>>> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);

    return this.http.get<ApiResponse<Record<string, number>>>(
      `${this.apiUrl}/habitacion/${habitacionId}/precios`,
      { params }
    );
  }

  verificarDisponibilidad(
    habitacionId: number,
    inicio: string,
    fin: string
  ): Observable<ApiResponse<boolean>> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);

    return this.http.get<ApiResponse<boolean>>(
      `${this.apiUrl}/habitacion/${habitacionId}/disponible`,
      { params }
    );
  }
}
