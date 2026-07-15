import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';
import { ExpenseCategory } from '../../../../models/expense-category';


@Component({
  selector: 'app-bank-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">{{ account().name }}</h3>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500">Balance (€)</label>
          <input
            type="number"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            [(ngModel)]="balance"
          />
        </div>

        <div class="border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium text-gray-500">Ingresos</p>
          <div class="flex gap-2">
            <input
              type="number" placeholder="Cantidad" aria-label="Cantidad"
              class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              [(ngModel)]="newIncomeAmount"
            />
            <input
              type="text" placeholder="Fuente (ej: nómina)" aria-label="Fuente"
              class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              [(ngModel)]="newIncomeSource"
            />
            <input
              type="text" placeholder="Descripción" aria-label="Descripción"
              class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
              [(ngModel)]="newIncomeDesc"
            />
            <button
              class="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              (click)="addIncome()"
            >+</button>
          </div>
          @for (inc of incomes(); track inc) {
            <div class="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <span class="font-medium text-green-600">+{{ inc.amount }} €</span>
              <span class="text-gray-500">{{ inc.source }}</span>
              <span class="text-gray-400">{{ inc.description }}</span>
            </div>
          }
        </div>

        <div class="border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium text-gray-500">Gastos</p>
          <div class="flex gap-2">
            <input
              type="number" placeholder="Cantidad" aria-label="Cantidad"
              class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              [(ngModel)]="newExpenseAmount"
            />
            <select
              aria-label="Categoría de gasto"
              class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              [(ngModel)]="newExpenseCategory"
            >
              <option value="">Categoría</option>
              <option [value]="ExpenseCategory.Comida">Comida</option>
              <option [value]="ExpenseCategory.Ocio">Ocio</option>
              <option [value]="ExpenseCategory.Coche">Coche</option>
              <option [value]="ExpenseCategory.Trabajo">Trabajo</option>
              <option [value]="ExpenseCategory.Ejercicio">Ejercicio</option>
              <option [value]="ExpenseCategory.Aseo">Aseo</option>
              <option [value]="ExpenseCategory.Medicamento">Medicamento</option>
              <option [value]="ExpenseCategory.Discord">Discord</option>
              <option [value]="ExpenseCategory.Otros">Otros</option>
            </select>
            <input
              type="text" placeholder="Descripción" aria-label="Descripción"
              class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              [(ngModel)]="newExpenseDesc"
            />
            <button
              class="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              (click)="addExpense()"
            >+</button>
          </div>
          @for (exp of expenses(); track exp) {
            <div class="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <span class="font-medium text-red-600">{{ exp.amount }} €</span>
              <span class="text-gray-500">{{ exp.category }}</span>
              <span class="text-gray-400">{{ exp.description }}</span>
            </div>
          }
        </div>

        <button
          class="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          (click)="save()"
        >Guardar Snapshot</button>
      </div>
    </div>
  `,
})
export class BankFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly account = input.required<Account>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected balance = signal(0);
  protected newIncomeAmount = signal(0);
  protected newIncomeSource = signal('');
  protected newIncomeDesc = signal('');
  protected newExpenseAmount = signal(0);
  protected newExpenseCategory = signal<ExpenseCategory>(ExpenseCategory.Comida);
  protected newExpenseDesc = signal('');

  protected readonly ExpenseCategory = ExpenseCategory;
  protected readonly incomes = signal<{ amount: number; source: string; description: string }[]>([]);
  protected readonly expenses = signal<{ amount: number; category: ExpenseCategory; description: string }[]>([]);

  protected addIncome(): void {
    if (!this.newIncomeAmount() || !this.newIncomeSource()) { return; }
    this.incomes.update(arr => [...arr, {
      amount: this.newIncomeAmount(),
      source: this.newIncomeSource(),
      description: this.newIncomeDesc(),
    }]);
    this.newIncomeAmount.set(0);
    this.newIncomeSource.set('');
    this.newIncomeDesc.set('');
  }

  protected addExpense(): void {
    if (!this.newExpenseAmount() || !this.newExpenseCategory()) { return; }
    this.expenses.update(arr => [...arr, {
      amount: this.newExpenseAmount(),
      category: this.newExpenseCategory(),
      description: this.newExpenseDesc(),
    }]);
    this.newExpenseAmount.set(0);
    this.newExpenseCategory.set(ExpenseCategory.Comida);
    this.newExpenseDesc.set('');
  }

  protected save(): void {
    const acc = this.account();
    const y = this.year();
    const m = this.month();
    const snapshotId = `${acc.id}-${y}-${String(m).padStart(2, '0')}`;
    const totalIncome = this.incomes().reduce((s, i) => s + i.amount, 0);
    const totalExpenses = this.expenses().reduce((s, e) => s + e.amount, 0);

    const existing = this.service.getSnapshot(acc.id, y, m);
    const incomeDelta = existing ? totalIncome - existing.income : totalIncome;
    this.service.upsertSnapshot(acc.id, y, m, this.balance(), incomeDelta, totalExpenses);

    for (const inc of this.incomes()) {
      this.service.addIncome({
        id: `inc-${snapshotId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        snapshotId,
        source: inc.source,
        description: inc.description,
        amount: inc.amount,
      });
    }

    for (const exp of this.expenses()) {
      this.service.addExpense({
        id: `exp-${snapshotId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        snapshotId,
        category: exp.category,
        amount: exp.amount,
        description: exp.description,
      });
    }

    this.incomes.set([]);
    this.expenses.set([]);
    this.balance.set(0);
  }
}
