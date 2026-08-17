import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MonthlySnapshot, MintosAnnualInterest } from '../../../../models';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

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
          [ngModel]="localMonth()"
          (ngModelChange)="localMonth.set(+$event)"
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
            placeholder="ej: 1250"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              [ngModel]="balance()"
              (ngModelChange)="balance.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Valor total en Mintos a 31 del mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses menusales (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 150"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              [ngModel]="income()"
              (ngModelChange)="income.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Total de intereses generados ese mes (Retorno aplicación)</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 50"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              [ngModel]="contribution()"
              (ngModelChange)="contribution.set($event)"
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
              [ngModel]="withdrawal()"
              (ngModelChange)="withdrawal.set($event)"
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

    @if (showAnnual()) {
      <div class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-amber-800">Mintos — Intereses anuales ({{ localYear() }})</h3>

        @if (annualLoading()) {
          <p class="text-sm text-gray-500">Cargando…</p>
        } @else {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Cantidad (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 1800"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                 [ngModel]="annualAmount()"
                 (ngModelChange)="annualAmount.set($event)"
              />
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retención de impuestos (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 90"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                 [ngModel]="annualTaxWithholding()"
                 (ngModelChange)="annualTaxWithholding.set($event)"
              />
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Tipo impositivo (%)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 19"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                 [ngModel]="annualTaxRate()"
                 (ngModelChange)="annualTaxRate.set($event)"
              />
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Importe después de impuestos (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 1710"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                 [ngModel]="annualNetAmount()"
                 (ngModelChange)="annualNetAmount.set($event)"
              />
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <button
              class="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
              [disabled]="!annualAmount()"
              (click)="saveAnnual()"
            >{{ annualId() ? 'Actualizar intereses anuales' : 'Guardar intereses anuales' }}</button>
            @if (annualSaved()) {
              <span class="text-sm text-emerald-600">✓ Guardado</span>
            }
          </div>
        }
      </div>
    }

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
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly balance = signal<number | null>(null);
  protected readonly income = signal<number | null>(null);
  protected readonly contribution = signal<number | null>(null);
  protected readonly withdrawal = signal<number | null>(null);
  protected readonly saved = signal(false);
  protected readonly editingSnapshot = signal<MonthlySnapshot | null>(null);

  protected readonly showAnnual = computed(() => this.localMonth() === 12);
  protected readonly annualLoading = signal(false);
  protected readonly annualSaved = signal(false);
  protected readonly annualId = signal<string | null>(null);
  protected readonly annualAmount = signal<number | null>(null);
  protected readonly annualTaxWithholding = signal<number | null>(null);
  protected readonly annualTaxRate = signal<number | null>(null);
  protected readonly annualNetAmount = signal<number | null>(null);

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
      .filter(s => s.year === this.localYear())
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
    }, { allowSignalWrites: true });

    effect(() => {
      this.localYear();
      this.localMonth();
      this.loadAnnualInterest();
    }, { allowSignalWrites: true });
  }

  protected loadAnnualInterest(): void {
    if (this.localMonth() !== 12) {
      this.clearAnnual();
      return;
    }
    this.annualLoading.set(true);
    this.service.getMintosAnnualInterest(this.localYear()).subscribe({
      next: interest => {
        if (interest) {
          this.annualId.set(interest.id);
          this.annualAmount.set(interest.amount);
          this.annualTaxWithholding.set(interest.taxWithholding);
          this.annualTaxRate.set(interest.taxRate);
          this.annualNetAmount.set(interest.netAmount);
        } else {
          this.clearAnnual();
        }
        this.annualLoading.set(false);
      },
      error: () => this.annualLoading.set(false),
    });
  }

  private clearAnnual(): void {
    this.annualId.set(null);
    this.annualAmount.set(null);
    this.annualTaxWithholding.set(null);
    this.annualTaxRate.set(null);
    this.annualNetAmount.set(null);
  }

  protected onEdit(snap: MonthlySnapshot): void {
    this.editingSnapshot.set(snap);
    this.service.currentYear.set(snap.year);
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
    const bal = roundMoney(this.balance() ?? 0) ?? 0;
    if (bal === null) { return; }

    const inc = roundMoney(this.income() ?? 0) ?? 0;
    const contrib = roundMoney(this.contribution() ?? 0) ?? 0;
    const withdrawal = roundMoney(this.withdrawal() ?? 0) ?? 0;

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

  protected saveAnnual(): void {
    const interest: MintosAnnualInterest = {
      id: this.annualId() ?? '',
      year: this.localYear(),
      amount: roundMoney(this.annualAmount() ?? 0) ?? 0,
      taxWithholding: roundMoney(this.annualTaxWithholding() ?? 0) ?? 0,
      taxRate: roundMoney(this.annualTaxRate() ?? 0) ?? 0,
      netAmount: roundMoney(this.annualNetAmount() ?? 0) ?? 0,
    };
    this.service.saveMintosAnnualInterest(interest).subscribe(saved => {
      this.annualId.set(saved.id);
      this.annualSaved.set(true);
      setTimeout(() => this.annualSaved.set(false), 2000);
    });
  }
}
