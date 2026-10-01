export type UrbanitaeCompraEstado = 'activa' | 'vendida';

export interface UrbanitaeCompra {
  id: string;
  fecha: string;
  entidad: string;
  monto: number;
  rendimiento?: number;
  estado: UrbanitaeCompraEstado;
}

export interface UrbanitaeCompraSave {
  fecha: string;
  entidad: string;
  monto: number;
  rendimiento?: number;
  estado: UrbanitaeCompraEstado;
}