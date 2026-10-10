export interface MintosBalance {
  id: string;
  mes: string;
  importeAnadido: number;
  valorFinal: number;
}

export interface MintosBalanceSave {
  importeAnadido?: number;
  valorFinal: number;
}