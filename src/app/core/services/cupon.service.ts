import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../models/api-response.model';
import { Cupon } from '../../models/cupon.model';

@Injectable({
  providedIn: 'root'
})
export class CuponService {
  private readonly apiUrl = 'http://localhost:8080/api/cupones';

  constructor(private http: HttpClient) {}

  validarCupon(codigo: string): Observable<ApiResponse<Cupon>> {
    return this.http.get<ApiResponse<Cupon>>(
      `${this.apiUrl}/validar/${codigo}`
    );
  }
}
