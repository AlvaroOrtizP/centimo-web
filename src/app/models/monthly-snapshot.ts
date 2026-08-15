import { ChecklistItem } from './checklist-item';

export interface MonthlySnapshot {
  id: string;
  accountId: string;
  year: number;
  month: number;
  balance: number;
  income: number;
  expenses: number;
  contribution?: number;
  tax?: number;
  notes?: string;
  checklistItems?: ChecklistItem[];
}
