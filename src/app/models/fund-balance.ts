/**
 * Balance mensual de un fondo de inversión de MyInvestor.
 * Un registro por fondo y mes.
 */
export interface FundBalance {
  id: string;
  fundId: string;
  year: number;
  month: number;
  balance: number;
  income?: number;
  contribution?: number;
  expenses?: number;
}
