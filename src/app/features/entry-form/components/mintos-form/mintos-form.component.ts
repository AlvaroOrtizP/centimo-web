import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';

@Component({
  selector: 'app-mintos-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Mintos — Balance mensual</h3>

      <div class="mb-4 flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          [(ngModel)]="localMonth"
        >
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
        <select
          aria-label="Año"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          [(ngModel)]="localYear"
        >
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
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
            placeholder="ej: 1250"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            [(ngModel)]="balance"
          />
          <p class="mt-0.5 text-xs text-gray-400">Valor total en Mintos a 31 del mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Ingresos este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 25"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            [(ngModel)]="income"
          />
          <p class="mt-0.5 text-xs text-gray-400">Intereses o rendimientos obtenidos</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 50"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            [(ngModel)]="contribution"
          />
          <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 100"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            [(ngModel)]="withdrawal"
          />
          <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <button
          class="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
          [disabled]="!balance()"
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
export class MintosFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly MINTOS_ACCOUNT_ID = 'mintos-main';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = signal(this.service.currentYear());

  protected readonly balance = signal<number | null>(null);
  protected readonly income = signal<number | null>(null);
  protected readonly contribution = signal<number | null>(null);
  protected readonly withdrawal = signal<number | null>(null);
  protected readonly saved = signal(false);
  protected readonly editingSnapshot = signal<MonthlySnapshot | null>(null);

  protected readonly snapshotId = computed(() =>
    `${this.MINTOS_ACCOUNT_ID}-${this.localYear()}-${String(this.localMonth()).padStart(2, '0')}`
  );

  protected readonly previousBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.MINTOS_ACCOUNT_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly history = computed(() =>
    this.service.getSnapshotsByAccount(this.MINTOS_ACCOUNT_ID)
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
  );

  constructor() {
    effect(() => {
      this.service.snapshots();
      this.localYear();
      this.localMonth();
      this.editingSnapshot.set(null);
      const snap = this.service.getSnapshot(this.MINTOS_ACCOUNT_ID, this.localYear(), this.localMonth());
      this.balance.set(snap?.balance ?? null);
      this.income.set(snap?.income ?? null);
      this.contribution.set(snap?.contribution ?? null);
      this.withdrawal.set(snap?.expenses && snap.expenses > 0 ? snap.expenses : null);
    });
  }

  protected onEdit(snap: MonthlySnapshot): void {
    this.editingSnapshot.set(snap);
    this.localYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.balance.set(snap.balance);
    this.income.set(snap.income > 0 ? snap.income : null);
    this.contribution.set(snap.contribution ?? null);
    this.withdrawal.set(snap.expenses > 0 ? snap.expenses : null);
  }

  protected cancelEdit(): void {
    this.editingSnapshot.set(null);
    this.balance.set(null);
    this.income.set(null);
    this.contribution.set(null);
    this.withdrawal.set(null);
  }

  protected onDelete(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected save(): void {
    const bal = this.balance();
    if (bal === null) { return; }

    const inc = this.income() ?? 0;
    const contrib = this.contribution() ?? 0;
    const withdrawal = this.withdrawal() ?? 0;

    const existing = this.editingSnapshot();
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: inc,
        contribution: contrib,
        expenses: withdrawal,
      });
      this.cancelEdit();
    } else {
      this.service.upsertSnapshot(this.MINTOS_ACCOUNT_ID, this.localYear(), this.localMonth(), bal, inc, withdrawal, contrib).subscribe();
    }

    this.income.set(null);
    this.contribution.set(null);
    this.withdrawal.set(null);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
