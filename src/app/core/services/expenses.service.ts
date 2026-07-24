import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ExpensesService } from '../../api/generated/api/expenses.service';
import { ExpenseCreate } from '../../api/generated/model/expenseCreate';
import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';
import { Expense } from '../../models/expense';

@Injectable({ providedIn: 'root' })
export class ExpensesDataService {
  private readonly expensesApi = inject(ExpensesService);

  readonly expenses = signal<Expense[]>([]);

  getExpensesBySnapshot(snapshotId: string): Expense[] {
    return this.expenses().filter(e => e.snapshotId === snapshotId);
  }

  loadExpenses(snapshotId: string): void {
    this.expensesApi.listExpenses(snapshotId).pipe(
      map(list => list.map(e => ({
        id: e.id,
        snapshotId: e.snapshotId,
        category: e.category,
        amount: e.amount,
        date: e.date,
        description: e.description ?? undefined,
      }))),
      catchError((err) => {
        console.error('[ExpensesData] loadExpenses error', err);
        return of([]);
      }),
    ).subscribe(expenses => {
      this.expenses.update(arr => {
        const others = arr.filter(e => e.snapshotId !== snapshotId);
        return [...others, ...expenses];
      });
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
        const result: Expense = {
          id: created.id,
          snapshotId: created.snapshotId,
          category: created.category,
          amount: created.amount,
          date: created.date,
          description: created.description ?? undefined,
        };
        this.expenses.update(arr => [...arr, result]);
        return result;
      }),
    );
  }

  updateExpense(id: string, data: ExpenseUpdate): Observable<Expense> {
    return this.expensesApi.updateExpense(id, data).pipe(
      map(updated => {
        const expense: Expense = {
          id: updated.id,
          snapshotId: updated.snapshotId,
          category: updated.category,
          amount: updated.amount,
          date: updated.date,
          description: updated.description ?? undefined,
        };
        this.expenses.update(arr => arr.map(e => e.id === id ? expense : e));
        return expense;
      }),
      catchError((err) => {
        console.error('[ExpensesData] updateExpense error', err);
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
