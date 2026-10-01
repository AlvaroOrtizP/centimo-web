export interface RevolutBalance {
  id: string;
  mes: string;
  balanceMensual: number;
  aporteMensual?: number;
  dineroTotal?: number;
  dineroHacienda?: number;
  dineroFinal?: number;
}

export interface RevolutBalanceSave {
  balanceMensual: number;
  aporteMensual?: number;
  dineroTotal?: number;
  dineroHacienda?: number;
  dineroFinal?: number;
}