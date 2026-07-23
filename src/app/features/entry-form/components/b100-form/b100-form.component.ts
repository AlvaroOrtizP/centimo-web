import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { createSnapshotField, resetSnapshotFields } from '../../snapshot-field.helper';

@Component({
  selector: 'app-b100-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Cuenta Ahorro -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">B100 — Cuenta Save</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            [(ngModel)]="localMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            aria-label="Año"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            [(ngModel)]="localYear"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        @if (previousSavingsBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousSavingsBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 12"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsInterest.display()"
              (ngModelChange)="savingsInterest.userValue.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Intereses obtenidos este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">TAE (%)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 2.5"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [(ngModel)]="savingsTae"
            />
            <p class="mt-0.5 text-xs text-gray-400">Opcional — referencia</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="!savingsBalance.display()"
            (click)="saveSavings()"
          >{{ hasExistingSavingsSnapshot() ? 'Editar balance' : 'Guardar' }}</button>
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

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 20"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentInterest.display()"
              (ngModelChange)="investmentInterest.userValue.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Intereses obtenidos este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">TAE (%)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 3.5"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [(ngModel)]="investmentTae"
            />
            <p class="mt-0.5 text-xs text-gray-400">Opcional — referencia</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="!investmentBalance.display()"
            (click)="saveInvestment()"
          >{{ hasExistingInvestmentSnapshot() ? 'Editar balance' : 'Guardar' }}</button>
          @if (savedInvestment()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial -->
      @if (history().length > 0) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Historial</p>
          <div class="space-y-1">
            @for (h of history(); track h.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="w-20 text-gray-500">{{ getMonthLabel(h.year, h.month) }}</span>
                <span class="font-semibold text-gray-900">{{ h.savings.toLocaleString('es-ES') }} €</span>
                <span class="text-xs text-gray-400">ahorro</span>
                <span class="font-semibold text-gray-900">{{ h.investment.toLocaleString('es-ES') }} €</span>
                <span class="text-xs text-gray-400">inversión</span>
              </div>
            }
          </div>
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
  protected readonly localYear = signal(this.service.currentYear());

  protected readonly savingsBalance = createSnapshotField(this.service, this.SAVINGS_ID, () => this.localYear(), () => this.localMonth());
  protected readonly savingsInterest = createSnapshotField(this.service, this.SAVINGS_ID, () => this.localYear(), () => this.localMonth(), 'income');
  protected readonly savingsTae = signal<number | null>(null);
  protected readonly savedSavings = signal(false);

  protected readonly investmentBalance = createSnapshotField(this.service, this.INVESTMENT_ID, () => this.localYear(), () => this.localMonth());
  protected readonly investmentInterest = createSnapshotField(this.service, this.INVESTMENT_ID, () => this.localYear(), () => this.localMonth(), 'income');
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

  protected readonly history = computed(() => {
    const savingsSnaps = this.service.getSnapshotsByAccount(this.SAVINGS_ID);
    const investmentSnaps = this.service.getSnapshotsByAccount(this.INVESTMENT_ID);

    const allMonths = new Set<string>();
    savingsSnaps.forEach(s => allMonths.add(`${s.year}-${s.month}`));
    investmentSnaps.forEach(s => allMonths.add(`${s.year}-${s.month}`));

    return Array.from(allMonths)
      .map(key => {
        const [y, m] = key.split('-').map(Number);
        const sav = savingsSnaps.find(s => s.year === y && s.month === m);
        const inv = investmentSnaps.find(s => s.year === y && s.month === m);
        return {
          id: key,
          year: y,
          month: m,
          savings: sav?.balance ?? 0,
          investment: inv?.balance ?? 0,
        };
      })
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
  });

  constructor() {
    effect(() => {
      this.localYear();
      this.localMonth();
      resetSnapshotFields(this.savingsBalance, this.savingsInterest, this.investmentBalance, this.investmentInterest);
    });
  }

  protected saveSavings(): void {
    const bal = this.savingsBalance.display();
    if (bal === null) { return; }

    const inter = this.savingsInterest.display() ?? 0;
    this.service.upsertSnapshot(this.SAVINGS_ID, this.localYear(), this.localMonth(), bal, inter).subscribe();

    this.savingsInterest.userValue.set(null);
    this.savingsInterest.hasUserValue.set(false);
    this.savedSavings.set(true);
    setTimeout(() => this.savedSavings.set(false), 2000);
  }

  protected saveInvestment(): void {
    const bal = this.investmentBalance.display();
    if (bal === null) { return; }

    const inter = this.investmentInterest.display() ?? 0;
    this.service.upsertSnapshot(this.INVESTMENT_ID, this.localYear(), this.localMonth(), bal, inter).subscribe();

    this.investmentInterest.userValue.set(null);
    this.investmentInterest.hasUserValue.set(false);
    this.savedInvestment.set(true);
    setTimeout(() => this.savedInvestment.set(false), 2000);
  }
}
