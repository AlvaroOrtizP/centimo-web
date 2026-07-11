import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';

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
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            [(ngModel)]="localMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
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
              [(ngModel)]="savingsBalance"
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
              [(ngModel)]="savingsInterest"
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
            [disabled]="!savingsBalance()"
            (click)="saveSavings()"
          >Guardar</button>
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
              [(ngModel)]="investmentBalance"
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
              [(ngModel)]="investmentInterest"
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
            [disabled]="!investmentBalance()"
            (click)="saveInvestment()"
          >Guardar</button>
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

  private readonly SAVINGS_ID = 'b100-savings';
  private readonly INVESTMENT_ID = 'b100-investment';
  private readonly MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  protected readonly months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];
  protected readonly years = [2024, 2025, 2026, 2027];

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = signal(this.service.currentYear());

  // Cuenta Ahorro
  protected readonly savingsBalance = signal<number | null>(null);
  protected readonly savingsInterest = signal<number | null>(null);
  protected readonly savingsTae = signal<number | null>(null);
  protected readonly savedSavings = signal(false);

  // Bolsillo Inversión
  protected readonly investmentBalance = signal<number | null>(null);
  protected readonly investmentInterest = signal<number | null>(null);
  protected readonly investmentTae = signal<number | null>(null);
  protected readonly savedInvestment = signal(false);

  protected readonly snapshotId = computed(() =>
    `${this.SAVINGS_ID}-${this.localYear()}-${String(this.localMonth()).padStart(2, '0')}`
  );

  protected readonly previousSavingsBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.SAVINGS_ID);
    const current = snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
    return current?.balance ?? null;
  });

  protected readonly previousInvestmentBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.INVESTMENT_ID);
    const current = snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
    return current?.balance ?? null;
  });

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
      const snap = this.service.getSnapshot(this.SAVINGS_ID, this.localYear(), this.localMonth());
      this.savingsBalance.set(snap?.balance ?? null);
    });

    effect(() => {
      const snap = this.service.getSnapshot(this.INVESTMENT_ID, this.localYear(), this.localMonth());
      this.investmentBalance.set(snap?.balance ?? null);
    });
  }

  protected getMonthLabel(year: number, month: number): string {
    return `${this.MONTH_NAMES[month - 1]} ${year}`;
  }

  protected saveSavings(): void {
    const bal = this.savingsBalance();
    if (bal === null) { return; }

    const y = this.localYear();
    const m = this.localMonth();
    const snapId = `${this.SAVINGS_ID}-${y}-${String(m).padStart(2, '0')}`;
    const inter = this.savingsInterest() ?? 0;

    const existing = this.service.getSnapshot(this.SAVINGS_ID, y, m);
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: existing.income + inter,
      });
    } else {
      this.service.addSnapshot({
        id: snapId,
        accountId: this.SAVINGS_ID,
        year: y,
        month: m,
        balance: bal,
        income: inter,
        expenses: 0,
      });
    }

    this.savingsInterest.set(null);
    this.savedSavings.set(true);
    setTimeout(() => this.savedSavings.set(false), 2000);
  }

  protected saveInvestment(): void {
    const bal = this.investmentBalance();
    if (bal === null) { return; }

    const y = this.localYear();
    const m = this.localMonth();
    const snapId = `${this.INVESTMENT_ID}-${y}-${String(m).padStart(2, '0')}`;
    const inter = this.investmentInterest() ?? 0;

    const existing = this.service.getSnapshot(this.INVESTMENT_ID, y, m);
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: existing.income + inter,
      });
    } else {
      this.service.addSnapshot({
        id: snapId,
        accountId: this.INVESTMENT_ID,
        year: y,
        month: m,
        balance: bal,
        income: inter,
        expenses: 0,
      });
    }

    this.investmentInterest.set(null);
    this.savedInvestment.set(true);
    setTimeout(() => this.savedInvestment.set(false), 2000);
  }
}
