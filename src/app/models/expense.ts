import { ExpenseCategory } from './expense-category';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description?: string;
}
