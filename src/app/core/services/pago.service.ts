import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagoRequest, PagoResponse } from '../../models/pago.model';
import { ApiResponse } from '../../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private readonly apiUrl = 'http://localhost:8080/api/pagos';

  constructor(private http: HttpClient) {}

  /**
   * Procesa un pago con Culqi
   */
  procesarPago(request: PagoRequest): Observable<ApiResponse<PagoResponse>> {
    return this.http.post<ApiResponse<PagoResponse>>(
      `${this.apiUrl}/procesar`,
      request
    );
  }

  /**
   * Obtiene el historial de pagos de una reserva
   */
  obtenerPagosPorReserva(reservaId: number): Observable<ApiResponse<PagoResponse[]>> {
    return this.http.get<ApiResponse<PagoResponse[]>>(
      `${this.apiUrl}/reserva/${reservaId}`
    );
  }

  /**
   * Solicita un reembolso
   */
  reembolsarPago(pagoId: number): Observable<ApiResponse<PagoResponse>> {
    return this.http.post<ApiResponse<PagoResponse>>(
      `${this.apiUrl}/${pagoId}/reembolsar`,
      {}
    );
  }
}
