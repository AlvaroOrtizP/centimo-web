import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MyInvestorFund } from '../../../../models/myinvestor-fund';

@Component({
  selector: 'app-myinvestor-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Cartera Metal -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">MyInvestor — Cartera Metal</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [(ngModel)]="localMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            aria-label="Año"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [(ngModel)]="localYear"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        @if (previousMetalBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousMetalBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 1200"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="metalBalance"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Cartera Metal a 31 del mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="metalContribution"
            />
            <p class="mt-0.5 text-xs text-gray-400">Opcional — cantidad ingresada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
            [disabled]="!metalBalance()"
            (click)="saveMetal()"
          >Guardar</button>
          @if (savedMetal()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Fondos — Registro -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Registrar fondo</h3>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Código / ISIN</label>
            <input
              type="text" placeholder="ej: ES0110237023"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="newCode"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Nombre del fondo</label>
            <input
              type="text" placeholder="ej: Indexa Capital Plan Mixto"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="newName"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
            [disabled]="!newCode || !newName"
            (click)="addFund()"
          >Registrar fondo</button>
          @if (savedFund()) {
            <span class="text-sm text-emerald-600">✓ Fondo registrado</span>
          }
        </div>
      </div>

      <!-- Fondos registrados -->
      @if (funds().length > 0) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Fondos registrados</p>
          <div class="space-y-1">
            @for (fund of funds(); track fund.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="flex-1 font-semibold text-gray-900 truncate">{{ fund.name }}</span>
                <span class="text-xs text-gray-400">{{ fund.code }}</span>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteFund(fund)"
                  title="Eliminar fondo"
                  aria-label="Eliminar fondo"
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

      <!-- Balance mensual por fondo -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Balance mensual por fondo</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes fondos"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [(ngModel)]="fundsLocalMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            aria-label="Año fondos"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [(ngModel)]="fundsLocalYear"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        @if (funds().length === 0) {
          <p class="text-sm text-gray-400">Primero registra un fondo en la sección de arriba.</p>
        } @else {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fondo</label>
              <select
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [(ngModel)]="selectedFundId"
              >
                <option value="">Seleccionar fondo</option>
                @for (fund of funds(); track fund.id) {
                  <option [value]="fund.id">{{ fund.name }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 4500"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [(ngModel)]="fundBalanceValue"
              />
            </div>
            <div class="flex items-end">
              <button
                class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
                [disabled]="!selectedFundId || !fundBalanceValue()"
                (click)="saveFundBalance()"
              >Guardar</button>
              @if (savedFundBalance()) {
                <span class="ml-3 text-sm text-emerald-600">✓ Guardado</span>
              }
            </div>
          </div>

          <!-- Balances del mes -->
          @if (currentMonthBalances().length > 0) {
            <div class="mt-4 border-t border-gray-100 pt-3">
              <div class="mb-2 flex items-center justify-between">
                <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Balances del mes</p>
                <p class="text-sm font-semibold text-gray-900">Total: {{ totalFundBalanceForMonth().toLocaleString('es-ES') }} €</p>
              </div>
              <div class="space-y-1">
                @for (b of currentMonthBalances(); track b.id) {
                  <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                    <span class="flex-1 font-medium text-gray-900">{{ getFundName(b.fundId) }}</span>
                    <span class="font-semibold text-gray-900">{{ b.balance.toLocaleString('es-ES') }} €</span>
                    <button
                      class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      (click)="deleteFundBalance(b)"
                      title="Eliminar balance"
                      aria-label="Eliminar balance"
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
        }
      </div>

      <!-- Intereses del mes (fondos) -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">MyInvestor Fondos — Intereses del mes</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes intereses"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [(ngModel)]="fundsLocalMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            aria-label="Año intereses"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [(ngModel)]="fundsLocalYear"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        @if (previousFundsIncome() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Intereses mes anterior: <strong>{{ previousFundsIncome()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 63"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="fundsInterest"
            />
            <p class="mt-0.5 text-xs text-gray-400">Rentabilidad total del mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
            [disabled]="!fundsInterest()"
            (click)="saveFundsIncome()"
          >Guardar intereses</button>
          @if (savedFundsIncome()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>
    </div>
  `,
})
export class MyInvestorFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly METAL_ID = 'myinvestor-metal';
  private readonly INVESTMENT_ID = 'myinvestor-investment';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  // --- Cartera Metal ---
  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = signal(this.service.currentYear());
  protected readonly metalBalance = signal<number | null>(null);
  protected readonly metalContribution = signal<number | null>(null);
  protected readonly savedMetal = signal(false);

  protected readonly previousMetalBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.METAL_ID);
    const current = snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
    return current?.balance ?? null;
  });

  // --- Fondos (lista) ---
  protected readonly funds = computed(() => this.service.myInvestorFunds());

  // --- Formulario nuevo fondo ---
  protected readonly newCode = signal('');
  protected readonly newName = signal('');
  protected readonly savedFund = signal(false);

  // --- Balance mensual por fondo ---
  protected readonly fundsLocalMonth = signal(this.service.currentMonth());
  protected readonly fundsLocalYear = signal(this.service.currentYear());
  protected readonly selectedFundId = signal('');
  protected readonly fundBalanceValue = signal<number | null>(null);
  protected readonly savedFundBalance = signal(false);

  protected readonly currentMonthBalances = computed(() =>
    this.service.getFundBalancesByMonth(this.fundsLocalYear(), this.fundsLocalMonth())
  );

  protected readonly totalFundBalanceForMonth = computed(() =>
    this.currentMonthBalances().reduce((sum, b) => sum + b.balance, 0)
  );

  // --- Intereses fondos ---
  protected readonly fundsInterest = signal<number | null>(null);
  protected readonly savedFundsIncome = signal(false);

  protected readonly previousFundsIncome = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.INVESTMENT_ID);
    const current = snapshots.find(s => s.year === this.fundsLocalYear() && s.month === this.fundsLocalMonth());
    return current?.income ?? null;
  });

  constructor() {
    effect(() => {
      const snapshots = this.service.snapshots();
      const y = this.localYear();
      const m = this.localMonth();
      this.metalBalance.set(
        snapshots.find(s => s.accountId === this.METAL_ID && s.year === y && s.month === m)?.balance ?? null
      );
    }, { allowSignalWrites: true });

    effect(() => {
      const snapshots = this.service.snapshots();
      const total = this.totalFundBalanceForMonth();
      const y = this.fundsLocalYear();
      const m = this.fundsLocalMonth();
      const snapId = `${this.INVESTMENT_ID}-${y}-${String(m).padStart(2, '0')}`;
      const existing = snapshots.find(s => s.accountId === this.INVESTMENT_ID && s.year === y && s.month === m);

      if (existing) {
        this.service.updateSnapshot(existing.id, { balance: total });
      } else if (total > 0) {
        this.service.addSnapshot({
          id: snapId,
          accountId: this.INVESTMENT_ID,
          year: y,
          month: m,
          balance: total,
          income: 0,
          expenses: 0,
        });
      }
    }, { allowSignalWrites: true });
  }

  protected getFundName(fundId: string): string {
    return this.funds().find(f => f.id === fundId)?.name ?? fundId;
  }

  // --- Cartera Metal ---
  protected saveMetal(): void {
    const bal = this.metalBalance();
    if (bal === null) { return; }

    const y = this.localYear();
    const m = this.localMonth();
    const snapId = `${this.METAL_ID}-${y}-${String(m).padStart(2, '0')}`;
    const contrib = this.metalContribution() ?? 0;

    const existing = this.service.getSnapshot(this.METAL_ID, y, m);
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: bal,
        income: existing.income + contrib,
      });
    } else {
      this.service.addSnapshot({
        id: snapId,
        accountId: this.METAL_ID,
        year: y,
        month: m,
        balance: bal,
        income: contrib,
        expenses: 0,
      });
    }

    this.metalContribution.set(null);
    this.savedMetal.set(true);
    setTimeout(() => this.savedMetal.set(false), 2000);
  }

  // --- Registro fondo ---
  protected addFund(): void {
    const code = this.newCode();
    const name = this.newName();
    if (!code || !name) { return; }

    this.service.addMyInvestorFund({
      id: `mif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      code,
      name,
    });

    this.newCode.set('');
    this.newName.set('');
    this.savedFund.set(true);
    setTimeout(() => this.savedFund.set(false), 2000);
  }

  protected deleteFund(fund: MyInvestorFund): void {
    this.service.deleteMyInvestorFund(fund.id);
  }

  // --- Balance mensual por fondo ---
  protected saveFundBalance(): void {
    const fundId = this.selectedFundId();
    const bal = this.fundBalanceValue();
    if (!fundId || bal === null) { return; }

    const y = this.fundsLocalYear();
    const m = this.fundsLocalMonth();
    const existing = this.service.getFundBalance(fundId, y, m);

    if (existing) {
      this.service.updateFundBalance(existing.id, { balance: bal });
    } else {
      this.service.addFundBalance({
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fundId,
        year: y,
        month: m,
        balance: bal,
      });
    }

    this.selectedFundId.set('');
    this.fundBalanceValue.set(null);
    this.savedFundBalance.set(true);
    setTimeout(() => this.savedFundBalance.set(false), 2000);
  }

  protected deleteFundBalance(balance: { id: string }): void {
    this.service.deleteFundBalance(balance.id);
  }

  // --- Intereses fondos ---
  protected saveFundsIncome(): void {
    const inter = this.fundsInterest();
    if (inter === null) { return; }

    const y = this.fundsLocalYear();
    const m = this.fundsLocalMonth();
    const snapId = `${this.INVESTMENT_ID}-${y}-${String(m).padStart(2, '0')}`;
    const total = this.totalFundBalanceForMonth();

    const existing = this.service.getSnapshot(this.INVESTMENT_ID, y, m);
    if (existing) {
      this.service.updateSnapshot(existing.id, {
        balance: total,
        income: existing.income + inter,
      });
    } else {
      this.service.addSnapshot({
        id: snapId,
        accountId: this.INVESTMENT_ID,
        year: y,
        month: m,
        balance: total,
        income: inter,
        expenses: 0,
      });
    }

    this.fundsInterest.set(null);
    this.savedFundsIncome.set(true);
    setTimeout(() => this.savedFundsIncome.set(false), 2000);
  }
}
