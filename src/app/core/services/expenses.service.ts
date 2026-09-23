import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';

import {
  ExpensesService,
} from '../../api/generated/api/expenses.service';
import { ExpenseCreate } from '../../api/generated/model/expenseCreate';
import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';
import { Expense as ApiExpense } from '../../api/generated/model/expense';
import { Expense } from '../../models';
import { LoggerService } from './logger.service';

function toExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    category: e.category as Expense['category'],
    amount: e.amount,
    date: e.date,
    description: e.description,
  };
}

function sameMonth(date: string, year: number, month: number): boolean {
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

@Injectable({ providedIn: 'root' })
export class ExpensesDataService {
  private readonly expensesApi = inject(ExpensesService);
  private readonly logger = inject(LoggerService);

  readonly expenses = signal<Expense[]>([]);

  /**
   * Periodos (año-mes) ya cargados desde el backend, para no repetir la llamada
   * al navegar entre meses ya visitados.
   */
  private readonly loadedPeriods = signal<Set<string>>(new Set());

  /**
   * Carga todos los gastos de un mes en UNA sola llamada (GET /expenses?year&month).
   * El merge se hace por fecha del gasto, de modo que es robusto aunque el backend
   * no filtre por year/month: solo se conservan los del periodo solicitado.
   */
  loadExpensesByMonth(year: number, month: number, force = false): void {
    const key = `${year}-${month}`;
    if (!force && this.loadedPeriods().has(key)) { return; }

    this.expensesApi.listExpenses(year, month, 'desc').pipe(
      map(list => list.map(toExpense)),
      catchError((err) => {
        this.logger.error('ExpensesData', 'loadExpensesByMonth error', err);
        return of([]);
      }),
    ).subscribe(list => {
      const monthList = list.filter(e => sameMonth(e.date, year, month));
      this.expenses.update(arr => {
        const others = arr.filter(e => !sameMonth(e.date, year, month));
        return [...others, ...monthList];
      });
      this.loadedPeriods.update(set => new Set(set).add(key));
    });
  }

  addExpense(expense: Omit<Expense, 'id'>): Observable<Expense> {
    const request: ExpenseCreate = {
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
    };

    return this.expensesApi.createExpense(request).pipe(
      map(toExpense),
      tap(item => {
        this.expenses.update(arr => [...arr, item]);
      }),
      catchError((err) => {
        this.logger.error('ExpensesData', 'addExpense error', err);
        throw err;
      }),
    );
  }

  updateExpense(id: string, data: Partial<Expense>): Observable<Expense> {
    const request: ExpenseUpdate = {
      category: data.category,
      amount: data.amount,
      date: data.date,
      description: data.description,
    };

    return this.expensesApi.updateExpense(id, request).pipe(
      map(toExpense),
      tap(item => {
        this.expenses.update(arr => arr.map(e => e.id === id ? item : e));
      }),
      catchError((err) => {
        this.logger.error('ExpensesData', `updateExpense(${id}) error`, err);
        throw err;
      }),
    );
  }

  deleteExpense(id: string): Observable<void> {
    return this.expensesApi.deleteExpense(id).pipe(
      tap(() => {
        this.expenses.update(arr => arr.filter(e => e.id !== id));
      }),
      catchError((err) => {
        this.logger.error('ExpensesData', `deleteExpense(${id}) error`, err);
        throw err;
      }),
    );
  }
}