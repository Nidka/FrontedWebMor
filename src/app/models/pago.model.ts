export interface PagoRequest {
  reservaId: number;
  monto: number;
  moneda: string;
  metodo: string;
  culqiToken: string;
  email: string;
  descripcion?: string;
  ultimosDigitos?: string;
  marcaTarjeta?: string;
}

export interface PagoResponse {
  id: number;
  reservaId: number;
  codigoReserva: string;
  monto: number;
  moneda: string;
  metodo: string;
  estado: string;
  transaccionId?: string;
  proveedorPago?: string;
  fechaPago?: string;
  mensaje?: string;
  urlRecibo?: string;
  ultimosDigitos?: string;
  marcaTarjeta?: string;
}
