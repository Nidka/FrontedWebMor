export interface Cupon {
  id: number;
  codigo: string;
  descripcion: string;
  tipoDescuento: string; // 'porcentaje' | 'monto_fijo'
  valorDescuento: number;
  montoMinimo?: number;
  fechaInicio?: string;
  fechaFin?: string;
  usosMaximos?: number;
  usosActuales: number;
  activo: boolean;
}
