import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { createSnapshotField, resetSnapshotFields } from '../../snapshot-field.helper';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-bitvavo-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Bitvavo — Balance mensual</h3>

      <div class="mb-4 flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          [ngModel]="localMonth()"
          (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>

      @if (previousBalance() !== null) {
        <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
          Balance mes anterior: <strong>{{ previousBalance()!.toLocaleString('es-ES') }} €</strong>
        </div>
      }

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 5000"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            [ngModel]="balance.display()"
            (ngModelChange)="onBalanceChange($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Valor total en Bitvavo a 31 del mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Ingresos este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 100"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            [ngModel]="income.display()"
            (ngModelChange)="income.userValue.set($event); income.hasUserValue.set(true)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Intereses o rendimientos percibidos</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Gastos este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 50"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            [ngModel]="expenses.display()"
            (ngModelChange)="expenses.userValue.set($event); expenses.hasUserValue.set(true)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Comisiones u otros gastos</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 200"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            [ngModel]="contribution.display()"
            (ngModelChange)="contribution.userValue.set($event); contribution.hasUserValue.set(true)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <button
          class="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
          [disabled]="!balance.display()"
          (click)="save()"
        >{{ editingSnapshot() ? 'Actualizar balance' : 'Guardar balance' }}</button>
        @if (editingSnapshot()) {
          <button
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            (click)="cancelEdit()"
          >Cancelar</button>
        }
        @if (saved()) {
          <span class="text-sm text-emerald-600">✓ Guardado</span>
        }
      </div>
    </div>

    <app-snapshot-history-table
      [snapshots]="history()"
      (edit)="onEdit($event)"
      (delete)="onDelete($event)"
    />
  `,
})
export class BitvavoFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly ACCOUNT_ID = 'bitvavo-main';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());
  protected readonly saved = signal(false);
  protected readonly editingSnapshot = signal<MonthlySnapshot | null>(null);

  protected readonly balance = createSnapshotField(this.service, this.ACCOUNT_ID, () => this.localYear(), () => this.localMonth());
  protected readonly income = createSnapshotField(this.service, this.ACCOUNT_ID, () => this.localYear(), () => this.localMonth(), 'income');
  protected readonly expenses = createSnapshotField(this.service, this.ACCOUNT_ID, () => this.localYear(), () => this.localMonth(), 'expenses');
  protected readonly contribution = createSnapshotField(this.service, this.ACCOUNT_ID, () => this.localYear(), () => this.localMonth(), 'contribution');

  protected readonly previousBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.ACCOUNT_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly history = computed(() =>
    this.service.getSnapshotsByAccount(this.ACCOUNT_ID)
      .filter(s => s.year === this.localYear())
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
  );

  constructor() {
    effect(() => {
      this.localYear();
      this.localMonth();
      this.editingSnapshot.set(null);
      resetSnapshotFields(this.balance, this.income, this.expenses, this.contribution);
    }, { allowSignalWrites: true });
  }

  protected onBalanceChange(value: number | null): void {
    this.balance.userValue.set(value);
    this.balance.hasUserValue.set(true);
  }

  protected onEdit(snap: MonthlySnapshot): void {
    this.editingSnapshot.set(snap);
    this.service.currentYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.balance.userValue.set(snap.balance);
    this.balance.hasUserValue.set(true);
    this.income.userValue.set(snap.income);
    this.income.hasUserValue.set(true);
    this.expenses.userValue.set(snap.expenses);
    this.expenses.hasUserValue.set(true);
    this.contribution.userValue.set(snap.contribution ?? null);
    this.contribution.hasUserValue.set(true);
  }

  protected cancelEdit(): void {
    this.editingSnapshot.set(null);
    resetSnapshotFields(this.balance, this.income, this.expenses, this.contribution);
  }

  protected onDelete(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected save(): void {
    const bal = roundMoney(this.balance.display() ?? 0) ?? 0;
    if (bal === null) { return; }

    const inc = roundMoney(this.income.display() ?? 0) ?? 0;
    const exp = roundMoney(this.expenses.display() ?? 0) ?? 0;
    const contrib = roundMoney(this.contribution.display() ?? null);
    const contributionValue = contrib != null ? contrib : 0;

    const existing = this.editingSnapshot();
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: inc,
        expenses: exp,
        contribution: contributionValue,
      });
      this.cancelEdit();
    } else {
      this.service.upsertSnapshot(this.ACCOUNT_ID, this.localYear(), this.localMonth(), bal, inc, exp, contributionValue).subscribe();
    }

    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
