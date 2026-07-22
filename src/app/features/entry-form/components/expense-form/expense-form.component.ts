import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';
import { ExpenseCategory } from '../../../../models/expense-category';
import { Expense } from '../../../../models/expense';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Añadir Gasto</h3>

      <div class="flex flex-wrap gap-2">
        <select aria-label="Categoría" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1" [(ngModel)]="category">
          <option value="">Categoría</option>
          <option [value]="ExpenseCategory.Comida">Comida</option>
          <option [value]="ExpenseCategory.Ocio">Ocio</option>
          <option [value]="ExpenseCategory.Coche">Coche</option>
          <option [value]="ExpenseCategory.Trabajo">Trabajo</option>
          <option [value]="ExpenseCategory.Ejercicio">Ejercicio</option>
          <option [value]="ExpenseCategory.Aseo">Aseo</option>
          <option [value]="ExpenseCategory.Medicamento">Medicamento</option>
          <option [value]="ExpenseCategory.Discord">Discord</option>
          <option [value]="ExpenseCategory.Hacienda">Hacienda</option>
          <option [value]="ExpenseCategory.Otros">Otros</option>
        </select>

        <input
          type="date" aria-label="Fecha"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          [(ngModel)]="date"
        />

        <input
          type="number" placeholder="Cantidad (€)" aria-label="Cantidad"
          class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          [(ngModel)]="amount"
        />

        <input
          type="text" placeholder="Descripción" aria-label="Descripción"
          class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          [(ngModel)]="description"
        />

        <button
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          [disabled]="!accountId() || !category() || !amount() || !date()"
          (click)="save()"
        >Añadir Gasto</button>
      </div>

      @if (saved()) {
        <p class="mt-2 text-sm text-green-600">Gasto añadido correctamente</p>
      }

      @if (expenses().length > 0) {
        <div class="mt-4 border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Gastos registrados</p>
          <div class="space-y-1">
            @for (exp of expenses(); track exp.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="font-medium text-red-600 w-24">{{ exp.amount.toLocaleString('es-ES') }} €</span>
                <span class="text-gray-700 w-20">{{ exp.date }}</span>
                <span class="text-gray-500 w-28">{{ exp.category }}</span>
                <span class="flex-1 text-gray-500 truncate">{{ exp.description }}</span>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteExpense(exp)"
                  title="Eliminar gasto"
                  aria-label="Eliminar gasto"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ExpenseFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected readonly accountId = computed(() => {
    return 'bbva-gasto';
  });

  protected readonly snapshotId = computed(() => {
    const accId = this.accountId();
    if (!accId) { return ''; }
    return `${accId}-${this.year()}-${String(this.month()).padStart(2, '0')}`;
  });

  protected readonly expenses = computed<Expense[]>(() => {
    const id = this.snapshotId();
    if (!id) { return []; }
    return this.service.getExpensesBySnapshot(id);
  });

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly category = signal<ExpenseCategory | ''>('');
  protected readonly amount = signal(0);
  protected readonly date = signal('');
  protected readonly description = signal('');
  protected readonly saved = signal(false);

  protected save(): void {
    const accId = this.accountId();
    const y = this.year();
    const m = this.month();
    const snapshotId = this.snapshotId();

    this.service.upsertSnapshot(accId, y, m, 0, 0).pipe(
      switchMap(() => this.service.addExpense({
        id: `exp-${snapshotId}-${Date.now()}`,
        snapshotId,
        category: this.category() as ExpenseCategory,
        amount: this.amount(),
        date: this.date(),
        description: this.description() || undefined,
      })),
    ).subscribe(() => {
      this.category.set('');
      this.amount.set(0);
      this.date.set('');
      this.description.set('');
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }

  protected deleteExpense(exp: Expense): void {
    this.service.deleteExpense(exp.id, this.snapshotId());
  }
}
