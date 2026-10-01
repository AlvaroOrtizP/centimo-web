export type MyInvestorFundTipo = 'fondo' | 'roboadvisor';

export interface MyInvestorFund {
  id: string;
  code?: string;
  name: string;
  tipo: MyInvestorFundTipo;
}