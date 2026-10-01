export type EquitoCompraEstado = 'activa' | 'vendida';

export interface EquitoCompra {
  id: string;
  fecha: string;
  entidad: string;
  monto: number;
  rendimiento?: number;
  estado: EquitoCompraEstado;
}

export interface EquitoCompraSave {
  fecha: string;
  entidad: string;
  monto: number;
  rendimiento?: number;
  estado: EquitoCompraEstado;
}