import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { createSnapshotField, resetSnapshotFields } from '../../snapshot-field.helper';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';

@Component({
  selector: 'app-revolut-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Revolut — Balance mensual</h3>

      <div class="mb-4 flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          [(ngModel)]="localMonth"
        >
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
        <select
          aria-label="Año"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
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
            placeholder="ej: 5000"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [ngModel]="balance.display()"
            (ngModelChange)="onBalanceChange($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Valor total en Revolut a 31 del mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses C. remunerada (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 15"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [ngModel]="interest.display()"
            (ngModelChange)="interest.userValue.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Intereses obtenidos este mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 100"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [(ngModel)]="contribution"
          />
          <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 50"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [(ngModel)]="withdrawal"
          />
          <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <button
          class="rounded-lg bg-pink-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
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
export class RevolutFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly ACCOUNT_ID = 'revolut-main';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = signal(this.service.currentYear());
  protected readonly tae = signal<number | null>(null);
  protected readonly contribution = signal<number | null>(null);
  protected readonly withdrawal = signal<number | null>(null);
  protected readonly saved = signal(false);
  protected readonly editingSnapshot = signal<MonthlySnapshot | null>(null);

  protected readonly balance = createSnapshotField(this.service, this.ACCOUNT_ID, () => this.localYear(), () => this.localMonth());
  protected readonly interest = createSnapshotField(this.service, this.ACCOUNT_ID, () => this.localYear(), () => this.localMonth(), 'income');

  protected readonly previousBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.ACCOUNT_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly hasExistingSnapshot = computed(() =>
    this.service.getSnapshotsByAccount(this.ACCOUNT_ID)
      .some(s => s.year === this.localYear() && s.month === this.localMonth())
  );

  protected readonly history = computed(() =>
    this.service.getSnapshotsByAccount(this.ACCOUNT_ID)
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
  );

  constructor() {
    effect(() => {
      this.localYear();
      this.localMonth();
      this.editingSnapshot.set(null);
      resetSnapshotFields(this.balance, this.interest);
      this.contribution.set(null);
      this.withdrawal.set(null);
    }, { allowSignalWrites: true });
  }

  protected onBalanceChange(value: number | null): void {
    this.balance.userValue.set(value);
    this.balance.hasUserValue.set(true);
  }

  protected onEdit(snap: MonthlySnapshot): void {
    this.editingSnapshot.set(snap);
    this.localYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.balance.userValue.set(snap.balance);
    this.balance.hasUserValue.set(true);
    this.interest.userValue.set(snap.income);
    this.interest.hasUserValue.set(true);
    this.contribution.set(snap.contribution ?? null);
    this.withdrawal.set(snap.expenses > 0 ? snap.expenses : null);
  }

  protected cancelEdit(): void {
    this.editingSnapshot.set(null);
    resetSnapshotFields(this.balance, this.interest);
    this.contribution.set(null);
    this.withdrawal.set(null);
  }

  protected onDelete(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected save(): void {
    const bal = this.balance.display();
    if (bal === null) { return; }

    const inter = this.interest.display() ?? 0;
    const contrib = this.contribution() ?? 0;
    const withdrawal = this.withdrawal() ?? 0;

    const existing = this.editingSnapshot();
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: inter,
        contribution: contrib,
        expenses: withdrawal,
      });
      this.cancelEdit();
    } else {
      this.service.upsertSnapshot(this.ACCOUNT_ID, this.localYear(), this.localMonth(), bal, inter, withdrawal, contrib).subscribe();
    }

    this.contribution.set(null);
    this.withdrawal.set(null);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
