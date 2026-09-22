export interface UrbanitaeBalance {
  id: string;
  mes: string;
  balanceMensual: number;
  aporteMensual?: number;
  dineroTotal?: number;
  dineroHacienda?: number;
  dineroFinal?: number;
}

export interface UrbanitaeBalanceSave {
  balanceMensual: number;
  aporteMensual?: number;
  dineroTotal?: number;
  dineroHacienda?: number;
  dineroFinal?: number;
}