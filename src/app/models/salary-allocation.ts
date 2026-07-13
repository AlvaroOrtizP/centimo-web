export interface SalaryAllocation {
  id: string;
  year: number;
  month: number;
  platformId: string;
  type: 'fixed' | 'percentage';
  value: number;
  note?: string;
}
