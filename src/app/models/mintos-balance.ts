export interface MintosBalance {
  id: string;
  mes: string;
  importeAnadido: number;
  valorFinal: number;
  interesesTotales: number;
  comisiones: number;
  impuestos: number;
}

export interface MintosBalanceSave {
  importeAnadido?: number;
  valorFinal: number;
  interesesTotales: number;
  comisiones: number;
  impuestos: number;
}