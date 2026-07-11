import { ExpenseCategory } from './expense-category';

export interface Expense {
  id: string;
  snapshotId: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
}
