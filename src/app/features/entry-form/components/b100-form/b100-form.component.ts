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
  selector: 'app-b100-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector mes/año -->
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          [ngModel]="localMonth()" (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
              <option [ngValue]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>

      <!-- Cuenta Ahorro -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">B100 — Cuenta Save</h3>

        @if (previousSavingsBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousSavingsBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 3000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsBalance.display()"
              (ngModelChange)="savingsBalance.userValue.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Cuenta Ahorro</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses este mes (€) <span class="text-amber-600">· neto 19% Hacienda</span></label>
            <input
              type="number"
              step="any"
              placeholder="ej: 12"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsInterest.display()"
              (ngModelChange)="onSavingsInterest($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Intereses tras retener el 19% de Hacienda</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-amber-600">Hacienda retenida (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 3"
              class="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              [ngModel]="savingsTax()"
              (ngModelChange)="savingsTax.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">19% retenido (auto, editable)</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsContribution()"
              (ngModelChange)="savingsContribution.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 50"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsWithdrawal()"
              (ngModelChange)="savingsWithdrawal.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="!savingsBalance.display()"
            (click)="saveSavings()"
          >{{ editingSavings() ? 'Actualizar balance' : 'Guardar' }}</button>
          @if (editingSavings()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditSavings()"
            >Cancelar</button>
          }
          @if (savedSavings()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Bolsillo Inversión -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">B100 — Cuenta Health</h3>

        @if (previousInvestmentBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousInvestmentBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 5000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentBalance.display()"
              (ngModelChange)="investmentBalance.userValue.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Bolsillo Inversión</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses este mes (€) <span class="text-amber-600">· neto 19% Hacienda</span></label>
            <input
              type="number"
              step="any"
              placeholder="ej: 20"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentInterest.display()"
              (ngModelChange)="onInvestmentInterest($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Intereses tras retener el 19% de Hacienda</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-amber-600">Hacienda retenida (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 5"
              class="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              [ngModel]="investmentTax()"
              (ngModelChange)="investmentTax.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">19% retenido (auto, editable)</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 200"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentContribution()"
              (ngModelChange)="investmentContribution.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentWithdrawal()"
              (ngModelChange)="investmentWithdrawal.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="!investmentBalance.display()"
            (click)="saveInvestment()"
          >{{ editingInvestment() ? 'Actualizar balance' : 'Guardar' }}</button>
          @if (editingInvestment()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditInvestment()"
            >Cancelar</button>
          }
          @if (savedInvestment()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial Save -->
      @if (historySavings().length > 0) {
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial Save</p>
          <app-snapshot-history-table
            [snapshots]="historySavings()"
            headingTooltip="Solo se muestran los dos últimos registros"
            (edit)="onEditSavings($event)"
            (delete)="onDeleteSavings($event)"
          />
        </div>
      }

      <!-- Historial Health -->
      @if (historyInvestment().length > 0) {
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial Health</p>
          <app-snapshot-history-table
            [snapshots]="historyInvestment()"
            headingTooltip="Solo se muestran los dos últimos registros"
            (edit)="onEditInvestment($event)"
            (delete)="onDeleteInvestment($event)"
          />
        </div>
      }
    </div>
  `,
})
export class B100FormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly SAVINGS_ID = 'b100-save';
  private readonly INVESTMENT_ID = 'b100-heal';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly editingSavings = signal<MonthlySnapshot | null>(null);
  protected readonly editingInvestment = signal<MonthlySnapshot | null>(null);

  protected readonly savingsBalance = createSnapshotField(this.service, this.SAVINGS_ID, () => this.localYear(), () => this.localMonth());
  protected readonly savingsInterest = createSnapshotField(this.service, this.SAVINGS_ID, () => this.localYear(), () => this.localMonth(), 'income');
  protected readonly savingsContribution = signal<number | null>(null);
  protected readonly savingsWithdrawal = signal<number | null>(null);
  protected readonly savingsTax = signal<number | null>(null);
  protected readonly savingsTae = signal<number | null>(null);
  protected readonly savedSavings = signal(false);

  protected readonly investmentBalance = createSnapshotField(this.service, this.INVESTMENT_ID, () => this.localYear(), () => this.localMonth());
  protected readonly investmentInterest = createSnapshotField(this.service, this.INVESTMENT_ID, () => this.localYear(), () => this.localMonth(), 'income');
  protected readonly investmentContribution = signal<number | null>(null);
  protected readonly investmentWithdrawal = signal<number | null>(null);
  protected readonly investmentTax = signal<number | null>(null);
  protected readonly investmentTae = signal<number | null>(null);
  protected readonly savedInvestment = signal(false);

  protected readonly previousSavingsBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.SAVINGS_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly previousInvestmentBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.INVESTMENT_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly hasExistingSavingsSnapshot = computed(() =>
    this.service.getSnapshotsByAccount(this.SAVINGS_ID)
      .some(s => s.year === this.localYear() && s.month === this.localMonth())
  );

  protected readonly hasExistingInvestmentSnapshot = computed(() =>
    this.service.getSnapshotsByAccount(this.INVESTMENT_ID)
      .some(s => s.year === this.localYear() && s.month === this.localMonth())
  );

  protected readonly historySavings = computed(() =>
    this.service.getSnapshotsByAccount(this.SAVINGS_ID)
      .filter(s => s.year === this.localYear())
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + b.month))
      .slice(0, 2)
  );

  protected readonly historyInvestment = computed(() =>
    this.service.getSnapshotsByAccount(this.INVESTMENT_ID)
      .filter(s => s.year === this.localYear())
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + b.month))
      .slice(0, 2)
  );

  private static readonly HACIENDA_RATE = 0.19;

  private static computeHacienda(netInterest: number): number {
    if (!netInterest) { return 0; }
    const gross = netInterest / (1 - B100FormComponent.HACIENDA_RATE);
    const tax = gross * B100FormComponent.HACIENDA_RATE;
    return Math.round(tax * 100) / 100;
  }

  protected onSavingsInterest(value: number | null): void {
    this.savingsInterest.userValue.set(value);
    this.savingsTax.set(value != null ? B100FormComponent.computeHacienda(value) : null);
  }

  protected onInvestmentInterest(value: number | null): void {
    this.investmentInterest.userValue.set(value);
    this.investmentTax.set(value != null ? B100FormComponent.computeHacienda(value) : null);
  }

  constructor() {
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();
      this.editingSavings.set(null);
      this.editingInvestment.set(null);
      resetSnapshotFields(this.savingsBalance, this.savingsInterest, this.investmentBalance, this.investmentInterest);
      this.savingsContribution.set(null);
      this.savingsWithdrawal.set(null);
      this.investmentContribution.set(null);
      this.investmentWithdrawal.set(null);

      const savingsSnap = this.service.getSnapshotsByAccount(this.SAVINGS_ID)
        .find(s => s.year === year && s.month === month);
      if (savingsSnap) {
        this.editingSavings.set(savingsSnap);
        this.savingsContribution.set(savingsSnap.contribution ?? null);
        this.savingsWithdrawal.set(savingsSnap.expenses > 0 ? savingsSnap.expenses : null);
      }
      this.savingsTax.set(
        savingsSnap ? (savingsSnap.tax != null ? savingsSnap.tax : B100FormComponent.computeHacienda(savingsSnap.income ?? 0)) : null
      );

      const investmentSnap = this.service.getSnapshotsByAccount(this.INVESTMENT_ID)
        .find(s => s.year === year && s.month === month);
      if (investmentSnap) {
        this.editingInvestment.set(investmentSnap);
        this.investmentContribution.set(investmentSnap.contribution ?? null);
        this.investmentWithdrawal.set(investmentSnap.expenses > 0 ? investmentSnap.expenses : null);
      }
      this.investmentTax.set(
        investmentSnap ? (investmentSnap.tax != null ? investmentSnap.tax : B100FormComponent.computeHacienda(investmentSnap.income ?? 0)) : null
      );
    }, { allowSignalWrites: true });
  }

  protected onEditSavings(snap: MonthlySnapshot): void {
    this.editingSavings.set(snap);
    this.service.currentYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.savingsBalance.userValue.set(snap.balance);
    this.savingsBalance.hasUserValue.set(true);
    this.savingsInterest.userValue.set(snap.income);
    this.savingsInterest.hasUserValue.set(true);
    this.savingsContribution.set(snap.contribution ?? null);
    this.savingsWithdrawal.set(snap.expenses > 0 ? snap.expenses : null);
    this.savingsTax.set(snap.tax ?? null);
  }

  protected cancelEditSavings(): void {
    this.editingSavings.set(null);
    this.savingsBalance.userValue.set(null);
    this.savingsBalance.hasUserValue.set(false);
    this.savingsInterest.userValue.set(null);
    this.savingsInterest.hasUserValue.set(false);
    this.savingsContribution.set(null);
    this.savingsWithdrawal.set(null);
    this.savingsTax.set(null);
  }

  protected onDeleteSavings(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected onEditInvestment(snap: MonthlySnapshot): void {
    this.editingInvestment.set(snap);
    this.service.currentYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.investmentBalance.userValue.set(snap.balance);
    this.investmentBalance.hasUserValue.set(true);
    this.investmentInterest.userValue.set(snap.income);
    this.investmentInterest.hasUserValue.set(true);
    this.investmentContribution.set(snap.contribution ?? null);
    this.investmentWithdrawal.set(snap.expenses > 0 ? snap.expenses : null);
    this.investmentTax.set(snap.tax ?? null);
  }

  protected cancelEditInvestment(): void {
    this.editingInvestment.set(null);
    this.investmentBalance.userValue.set(null);
    this.investmentBalance.hasUserValue.set(false);
    this.investmentInterest.userValue.set(null);
    this.investmentInterest.hasUserValue.set(false);
    this.investmentContribution.set(null);
    this.investmentWithdrawal.set(null);
    this.investmentTax.set(null);
  }

  protected onDeleteInvestment(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected saveSavings(): void {
    const bal = roundMoney(this.savingsBalance.display() ?? 0) ?? 0;
    if (bal === null) { return; }

    const inter = roundMoney(this.savingsInterest.display() ?? 0) ?? 0;
    const contrib = roundMoney(this.savingsContribution() ?? 0) ?? 0;
    const withdrawal = roundMoney(this.savingsWithdrawal() ?? 0) ?? 0;
    const tax = roundMoney(this.savingsTax() ?? 0) ?? 0;

    const existing = this.editingSavings();
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: inter,
        contribution: contrib,
        expenses: withdrawal,
        tax,
      });
      this.cancelEditSavings();
    } else {
      this.service.upsertSnapshot(this.SAVINGS_ID, this.localYear(), this.localMonth(), bal, inter, withdrawal, contrib, tax).subscribe();
    }

    this.savedSavings.set(true);
    setTimeout(() => this.savedSavings.set(false), 2000);
  }

  protected saveInvestment(): void {
    const bal = roundMoney(this.investmentBalance.display() ?? 0) ?? 0;
    if (bal === null) { return; }

    const inter = roundMoney(this.investmentInterest.display() ?? 0) ?? 0;
    const contrib = roundMoney(this.investmentContribution() ?? 0) ?? 0;
    const withdrawal = roundMoney(this.investmentWithdrawal() ?? 0) ?? 0;
    const tax = roundMoney(this.investmentTax() ?? 0) ?? 0;

    const existing = this.editingInvestment();
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: inter,
        contribution: contrib,
        expenses: withdrawal,
        tax,
      });
      this.cancelEditInvestment();
    } else {
      this.service.upsertSnapshot(this.INVESTMENT_ID, this.localYear(), this.localMonth(), bal, inter, withdrawal, contrib, tax).subscribe();
    }

    this.savedInvestment.set(true);
    setTimeout(() => this.savedInvestment.set(false), 2000);
  }
}
