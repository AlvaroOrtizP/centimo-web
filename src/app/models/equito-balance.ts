export interface EquitoBalance {
  id: string;
  mes: string;
  balanceMensual: number;
  aporteMensual?: number;
  dineroTotal?: number;
  dineroHacienda?: number;
  dineroFinal?: number;
}

export interface EquitoBalanceSave {
  balanceMensual: number;
  aporteMensual?: number;
  dineroTotal?: number;
  dineroHacienda?: number;
  dineroFinal?: number;
}