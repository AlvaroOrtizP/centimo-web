import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ExpensesService } from '../../api/generated/api/expenses.service';
import { ExpenseCreate } from '../../api/generated/model/expenseCreate';
import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';
import { Expense as ApiExpense } from '../../api/generated/model/expense';
import { Expense } from '../../models';
import { LoggerService } from './logger.service';

function toExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    snapshotId: e.snapshotId,
    category: e.category,
    amount: e.amount,
    date: e.date,
    description: e.description ?? undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class ExpensesDataService {
  private readonly expensesApi = inject(ExpensesService);
  private readonly logger = inject(LoggerService);

  readonly expenses = signal<Expense[]>([]);

  getExpensesBySnapshot(snapshotId: string): Expense[] {
    return this.expenses().filter(e => e.snapshotId === snapshotId);
  }

  loadExpenses(snapshotId: string): void {
    this.expensesApi.listExpenses(snapshotId).pipe(
      map(list => list.map(toExpense)),
      catchError((err) => {
        this.logger.error('ExpensesData', 'loadExpenses error', err);
        return of([]);
      }),
    ).subscribe(expenses => {
      this.expenses.update(arr => {
        const others = arr.filter(e => e.snapshotId !== snapshotId);
        return [...others, ...expenses];
      });
    });
  }

  loadExpensesByPeriod(year: number, month: number): void {
    this.expensesApi.listExpenses(undefined, year, month).pipe(
      map(list => list.map(toExpense)),
      catchError((err) => {
        this.logger.error('ExpensesData', 'loadExpensesByPeriod error', err);
        return of([]);
      }),
    ).subscribe(expenses => {
      this.expenses.set(expenses);
    });
  }

  addExpense(expense: Expense): Observable<Expense> {
    const create: ExpenseCreate = {
      snapshotId: expense.snapshotId,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description ?? null,
    };
    return this.expensesApi.createExpense(create).pipe(
      map(created => {
        const result = toExpense(created);
        this.expenses.update(arr => [...arr, result]);
        return result;
      }),
    );
  }

  updateExpense(id: string, data: ExpenseUpdate): Observable<Expense> {
    return this.expensesApi.updateExpense(id, data).pipe(
      map(updated => {
        const expense = toExpense(updated);
        this.expenses.update(arr => arr.map(e => e.id === id ? expense : e));
        return expense;
      }),
      catchError((err) => {
        this.logger.error('ExpensesData', 'updateExpense error', err);
        return of(null as unknown as Expense);
      }),
    );
  }

  deleteExpense(id: string, snapshotId: string): void {
    this.expensesApi.deleteExpense(id, snapshotId).subscribe(() => {
      this.expenses.update(arr => arr.filter(e => e.id !== id));
    });
  }

}
