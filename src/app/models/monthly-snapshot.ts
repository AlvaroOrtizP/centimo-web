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
  notes?: string;
  checklistItems?: ChecklistItem[];
}
