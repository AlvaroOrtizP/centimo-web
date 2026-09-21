import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// TODO(BACKEND): servicios y modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { ExpensesService } from '../../api/generated/api/expenses.service';
// import { ExpenseCreate } from '../../api/generated/model/expenseCreate';
// import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';
// import { Expense as ApiExpense } from '../../api/generated/model/expense';
import { Expense } from '../../models';
import { LoggerService } from './logger.service';

// function toExpense(e: ApiExpense): Expense { ... } // TODO(BACKEND): pendiente de la nueva API.

function sameMonth(date: string, year: number, month: number): boolean {
  const d = new Date(date);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

@Injectable({ providedIn: 'root' })
export class ExpensesDataService {
  // private readonly expensesApi = inject(ExpensesService);
  private readonly logger = inject(LoggerService);

  readonly expenses = signal<Expense[]>([]);

  /**
   * Periodos (año-mes) ya cargados desde el backend, para no repetir la llamada
   * al navegar entre meses ya visitados.
   */
  private readonly loadedPeriods = signal<Set<string>>(new Set());

  getExpensesBySnapshot(snapshotId: string): Expense[] {
    return this.expenses().filter(e => e.snapshotId === snapshotId);
  }

  /**
   * Carga todos los gastos de un mes en UNA sola llamada (GET /expenses?year&month).
   * El merge se hace por fecha del gasto, de modo que es robusto aunque el backend
   * no filtre por year/month: solo se conservan los del periodo solicitado.
   */
  loadExpensesByMonth(year: number, month: number, force = false): void {
    const key = `${year}-${month}`;
    if (!force && this.loadedPeriods().has(key)) { return; }

    // TODO(BACKEND): llamada a GET /expenses (por mes) comentada.
    // this.expensesApi.listExpenses(undefined, year, month).pipe(
    //   map(list => list.map(toExpense)),
    //   catchError((err) => {
    //     this.logger.error('ExpensesData', 'loadExpensesByMonth error', err);
    //     return of([]);
    //   }),
    // ).subscribe(list => {
    //   const monthList = list.filter(e => sameMonth(e.date, year, month));
    //   this.expenses.update(arr => {
    //     const others = arr.filter(e => !sameMonth(e.date, year, month));
    //     return [...others, ...monthList];
    //   });
    //   this.loadedPeriods.update(set => new Set(set).add(key));
    // });
  }

  loadExpenses(snapshotId: string): void {
    // TODO(BACKEND): llamada a GET /expenses (por snapshot) comentada.
    // this.expensesApi.listExpenses(snapshotId).pipe(
    //   map(list => list.map(toExpense)),
    //   catchError((err) => {
    //     this.logger.error('ExpensesData', 'loadExpenses error', err);
    //     return of([]);
    //   }),
    // ).subscribe(expenses => {
    //   this.expenses.update(arr => {
    //     if (expenses.length === 0) { return arr; }
    //     const others = arr.filter(e => e.snapshotId !== snapshotId);
    //     return [...others, ...expenses];
    //   });
    // });
  }

  addExpense(expense: Expense): Observable<Expense> {
    // TODO(BACKEND): llamada a POST /expenses comentada.
    this.expenses.update(arr => [...arr, expense]);
    return of(expense);
  }

  updateExpense(id: string, data: any): Observable<Expense> {
    // TODO(BACKEND): llamada a PUT /expenses/{id} comentada.
    const expense: Expense = {
      id,
      snapshotId: data.snapshotId ?? '',
      category: data.category,
      amount: data.amount,
      date: data.date,
      description: data.description ?? undefined,
    };
    this.expenses.update(arr => arr.map(e => e.id === id ? expense : e));
    return of(expense);
  }

  deleteExpense(id: string, snapshotId: string): void {
    // TODO(BACKEND): llamada a DELETE /expenses/{id} comentada.
    this.expenses.update(arr => arr.filter(e => e.id !== id));
  }

}
