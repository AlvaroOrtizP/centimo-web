export interface BancoBalance {
  id: string;
  entidad: string;
  mes: string;
  balanceMensual: number;
  aporteMensual?: number;
}

export interface BancoBalanceSave {
  balanceMensual: number;
  aporteMensual?: number;
}