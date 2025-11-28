export interface Hotel {
  id: number;
  nombre: string;
  descripcion: string;
  direccion: Direccion;
  telefono: string;
  emailContacto: string;
  estrellas: number;
  precioMinimo: number;
  precioMaximo: number;
  estado: string;
  destacado: boolean;
  puntuacionPromedio: number;
  totalReviews: number;
  propietario: PropietarioDTO;
  imagen?: string;
  precioDesde?: number;
}

export interface Direccion {
  id?: number;
  calle: string;
  ciudad: string;
  estadoProvincia: string;
  pais: string;
  codigoPostal: string;
  latitud?: number;
  longitud?: number;
  direccionCompleta?: string;
}

export interface PropietarioDTO {
  id: number;
  nombre: string;
  email: string;
}

export interface HotelSearchRequest {
  ciudad?: string;
  pais?: string;
  estrellas?: number;
  precioMinimo?: number;
  precioMaximo?: number;
  puntuacionMinima?: number;
  latitud?: number;
  longitud?: number;
  radioKm?: number;
  amenidades?: string[];
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
