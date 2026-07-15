export type SalaryAllocationType = 'fixed' | 'percentage';

export interface SalaryAllocation {
  id: string;
  year: number;
  month: number;
  platformId: string;
  type: SalaryAllocationType;
  value: number;
  note?: string;
}
