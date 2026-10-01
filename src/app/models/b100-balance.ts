export type B100Subcuenta = 'save' | 'health';

export interface B100Balance {
  id: string;
  tipoSubcuenta: B100Subcuenta;
  mes: string;
  balanceMensual: number;
  aporteMensual?: number;
  dineroHacienda?: number;
  dineroTotalRepartir: number;
  porcentajeHacienda?: number;
}

export interface B100BalanceSave {
  balanceMensual: number;
  dineroTotalRepartir: number;
  aporteMensual?: number;
  dineroHacienda?: number;
  porcentajeHacienda?: number;
}