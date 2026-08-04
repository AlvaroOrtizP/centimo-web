import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTHS, YEARS } from '../../../../core/constants/date.constants';
import { ExpenseCategory } from '../../../../models/expense-category';
import { Expense } from '../../../../models/expense';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">{{ editingExpense() ? 'Editar Gasto' : 'Añadir Gasto' }}</h3>

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
          class="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
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
          [disabled]="!snapshotId() || !category() || !amount() || !date()"
          (click)="save()"
        >{{ editingExpense() ? 'Guardar cambios' : 'Añadir Gasto' }}</button>

        @if (editingExpense()) {
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            (click)="cancelEdit()"
          >Cancelar</button>
        }
      </div>

      @if (saved()) {
        <p class="mt-2 text-sm text-green-600">Gasto guardado correctamente</p>
      }

      <div class="mt-4 border-t border-gray-100 pt-3">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Gastos registrados</p>
          <div class="flex items-center gap-2">
            <select
              aria-label="Mes del historial de gastos"
              class="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              [ngModel]="listMonth()"
              (ngModelChange)="listMonth.set(+$event)"
            >
              @for (m of months; track $index) {
                <option [value]="$index + 1">{{ m }}</option>
              }
            </select>
            <select
              aria-label="Año del historial de gastos"
              class="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
              [ngModel]="listYear()"
              (ngModelChange)="listYear.set(+$event)"
            >
              @for (y of years; track y) {
                <option [value]="y">{{ y }}</option>
              }
            </select>
            <p class="text-sm font-semibold text-red-600">{{ total().toLocaleString('es-ES') }} €</p>
          </div>
        </div>
        @if (expenses().length > 0) {
          <div class="space-y-1">
            @for (exp of expenses(); track exp.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="font-medium text-red-600 w-24">{{ exp.amount.toLocaleString('es-ES') }} €</span>
                <span class="text-gray-700 w-30">{{ exp.date }}</span>
                <span class="text-gray-500 w-28">{{ exp.category }}</span>
                <span class="flex-1 text-gray-500 truncate">{{ exp.description }}</span>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                  (click)="startEdit(exp)"
                  title="Editar gasto"
                  aria-label="Editar gasto"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                  </svg>
                </button>
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
        } @else {
          <p class="text-sm text-gray-400">No hay gastos registrados en este mes.</p>
        }
      </div>
    </div>
  `,
})
export class ExpenseFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly year = input.required<number>();
  readonly month = input.required<number>();

  private readonly ACCOUNT_ID = 'bbva-gasto';

  protected readonly snapshotId = signal('');

  protected readonly months = MONTHS;
  protected readonly years = YEARS;

  protected readonly listMonth = signal(this.service.currentMonth());
  protected readonly listYear = signal(this.service.currentYear());

  constructor() {
    effect(() => {
      this.listYear.set(this.year());
      this.listMonth.set(this.month());
    }, { allowSignalWrites: true });

    effect(() => {
      const y = this.year();
      const m = this.month();

      const existing = this.service.getSnapshot(this.ACCOUNT_ID, y, m);
      if (existing) {
        this.snapshotId.set(existing.id);
        return;
      }
      this.service.upsertSnapshot(this.ACCOUNT_ID, y, m, 0, 0).subscribe(res => {
        this.snapshotId.set(res.id);
      });
    }, { allowSignalWrites: true });

    effect(() => {
      this.service.loadExpensesByPeriod(this.listYear(), this.listMonth());
    }, { allowSignalWrites: true });
  }

  protected readonly expenses = computed<Expense[]>(() =>
    this.service.getExpensesByPeriod(this.listYear(), this.listMonth())
  );

  protected readonly total = computed(() =>
    this.expenses().reduce((sum, e) => sum + e.amount, 0)
  );

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly category = signal<ExpenseCategory | ''>('');
  protected readonly amount = signal(0);
  protected readonly date = signal(new Date().toISOString().slice(0, 10));
  protected readonly description = signal('');
  protected readonly saved = signal(false);
  protected readonly editingExpense = signal<Expense | null>(null);

  protected save(): void {
    const editing = this.editingExpense();

    if (editing) {
      this.service.updateExpense(editing.id, {
        snapshotId: editing.snapshotId,
        category: this.category() as ExpenseCategory,
        amount: this.amount(),
        date: this.date(),
        description: this.description() || undefined,
      }).subscribe(() => {
        this.cancelEdit();
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      });
      return;
    }

    const snapId = this.snapshotId();

    this.service.addExpense({
      id: `exp-${snapId}-${Date.now()}`,
      snapshotId: snapId,
      category: this.category() as ExpenseCategory,
      amount: this.amount(),
      date: this.date(),
      description: this.description() || undefined,
    }).subscribe(() => {
      this.resetForm();
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }

  protected startEdit(exp: Expense): void {
    this.editingExpense.set(exp);
    this.category.set(exp.category);
    this.amount.set(exp.amount);
    this.date.set(exp.date);
    this.description.set(exp.description ?? '');
  }

  protected cancelEdit(): void {
    this.editingExpense.set(null);
    this.resetForm();
  }

  protected deleteExpense(exp: Expense): void {
    this.service.deleteExpense(exp.id, exp.snapshotId);
  }

  private resetForm(): void {
    this.category.set('');
    this.amount.set(0);
    this.date.set('');
    this.description.set('');
  }
}
