import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, MONTHS, YEARS } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MyInvestorFund } from '../../../../models/myinvestor-fund';
import { FundBalance } from '../../../../models/fund-balance';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-myinvestor-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Balance mensual por fondo -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Balance mensual por fondo</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes fondos"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
            [ngModel]="fundsLocalMonth()"
            (ngModelChange)="fundsLocalMonth.set($event)"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>

        @if (funds().length === 0) {
          <p class="text-sm text-gray-400">Primero registra un fondo en la sección inferior.</p>
        } @else {
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fondo</label>
              <select
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [ngModel]="selectedFundId()"
                (ngModelChange)="selectedFundId.set($event)"
              >
                <option value="">Seleccionar fondo</option>
                @for (fund of funds(); track fund.id) {
                  <option [value]="fund.id">{{ fund.name }}</option>
                }
              </select>
            </div>
            @if (previousFundBalance() !== null) {
              <div class="flex items-end">
                <p class="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
                  Balance mes anterior: <strong>{{ previousFundBalance()!.toLocaleString('es-ES') }} €</strong>
                </p>
              </div>
            }
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 4500"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [ngModel]="fundBalanceValue()"
              (ngModelChange)="fundBalanceValue.set($event)"
              />
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses este mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 63"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [ngModel]="fundsIncomeValue()"
              (ngModelChange)="fundsIncomeValue.set($event)"
              />
              <p class="mt-0.5 text-xs text-gray-400">Intereses obtenidos este mes</p>
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 100"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [ngModel]="fundsContributionValue()"
              (ngModelChange)="fundsContributionValue.set($event)"
              />
              <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 50"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
                [ngModel]="fundsWithdrawalValue()"
              (ngModelChange)="fundsWithdrawalValue.set($event)"
              />
              <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <button
              class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
              [disabled]="!selectedFundId() || !fundBalanceValue()"
              (click)="saveFundBalance()"
            >{{ editingFundBalance() ? 'Actualizar balance' : 'Guardar balance' }}</button>
            @if (editingFundBalance()) {
              <button
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                (click)="cancelEditBalance()"
              >Cancelar</button>
            }
            @if (savedFundBalance()) {
              <span class="text-sm text-emerald-600">✓ Guardado</span>
            }
          </div>
          <p class="mt-2 text-sm text-gray-600">
            Balance total fondos del mes: <strong class="text-gray-900">{{ totalFundBalanceForMonth().toLocaleString('es-ES') }} €</strong>
          </p>

          <!-- Historial de balances -->
          <div class="mt-4 border-t border-gray-100 pt-4">
            <div class="mb-3 flex items-center justify-between">
              <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Historial de balances</p>
              <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{{ historyBalances().length }} registros</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th class="px-4 py-3">Fondo</th>
                    <th class="px-4 py-3">Mes</th>
                    <th class="px-4 py-3 text-right">Balance</th>
                    <th class="px-4 py-3 text-right">Intereses</th>
                    <th class="px-4 py-3 text-right">Retiradas</th>
                    <th class="px-4 py-3 text-right">Aportación</th>
                    <th class="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @if (historyBalances().length === 0) {
                    <tr>
                      <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">Sin registros todavía. Guarda un balance para este mes.</td>
                    </tr>
                  } @else {
                    @for (b of historyBalances(); track b.id) {
                      <tr class="transition-all duration-150 hover:bg-gray-50/80">
                        <td class="px-4 py-3 font-semibold text-gray-900">{{ getFundName(b.fundId) }}</td>
                        <td class="px-4 py-3 font-semibold text-gray-900">{{ MONTHS[b.month - 1] }} {{ b.year }}</td>
                        <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ b.balance.toLocaleString('es-ES') }} €</td>
                        <td class="px-4 py-3 text-right font-medium text-emerald-600">{{ (b.income ?? 0) > 0 ? '+' + b.income!.toLocaleString('es-ES') : '-' }}</td>
                        <td class="px-4 py-3 text-right font-medium text-red-600">{{ (b.expenses ?? 0) > 0 ? b.expenses!.toLocaleString('es-ES') + ' €' : '-' }}</td>
                        <td class="px-4 py-3 text-right text-gray-500">{{ b.contribution ? b.contribution!.toLocaleString('es-ES') + ' €' : '-' }}</td>
                        <td class="px-4 py-3 text-center">
                          <div class="flex items-center justify-center gap-1">
                            <button
                              class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                              (click)="onEditBalance(b)"
                              title="Editar balance"
                              aria-label="Editar balance"
                            >
                              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                              </svg>
                            </button>
                            <button
                              class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              (click)="deleteFundBalance(b)"
                              title="Eliminar balance"
                              aria-label="Eliminar balance"
                            >
                              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
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
              [ngModel]="newCode()"
              (ngModelChange)="newCode.set($event)"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Nombre del fondo</label>
            <input
              type="text" placeholder="ej: Indexa Capital Plan Mixto"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [ngModel]="newName()"
              (ngModelChange)="newName.set($event)"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
            [disabled]="!newCode() || !newName()"
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
          <button
            type="button"
            class="flex w-full items-center justify-between text-left"
            (click)="fundsListExpanded.set(!fundsListExpanded())"
            [attr.aria-expanded]="fundsListExpanded()"
          >
            <span class="text-xs font-medium uppercase tracking-wider text-gray-500">Fondos registrados</span>
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
              class="text-gray-400 transition-transform"
              [class.rotate-180]="fundsListExpanded()"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          @if (fundsListExpanded()) {
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
          }
        </div>
      }

    </div>
  `,
})
export class MyInvestorFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly INVESTMENT_ID = 'myinvestor-fondo';
  protected readonly months = MONTH_OPTIONS;

  protected readonly years = YEARS;

  protected readonly MONTHS = MONTHS;

  // --- Fondos (lista) ---
  protected readonly funds = computed(() => this.service.myInvestorFunds());
  protected readonly fundsListExpanded = signal(false);

  // --- Formulario nuevo fondo ---
  protected readonly newCode = signal('');
  protected readonly newName = signal('');
  protected readonly savedFund = signal(false);

  // --- Balance mensual por fondo ---
  protected readonly fundsLocalMonth = signal(this.service.currentMonth());
  protected readonly fundsLocalYear = computed(() => this.service.currentYear());
  protected readonly selectedFundId = signal('');
  protected readonly fundBalanceValue = signal<number | null>(null);
  protected readonly fundsIncomeValue = signal<number | null>(null);
  protected readonly fundsContributionValue = signal<number | null>(null);
  protected readonly fundsWithdrawalValue = signal<number | null>(null);
  protected readonly editingFundBalance = signal<FundBalance | null>(null);
  protected readonly savedFundBalance = signal(false);

  protected readonly currentMonthBalances = computed(() =>
    this.service.getFundBalancesByMonth(this.fundsLocalYear(), this.fundsLocalMonth())
  );

  protected readonly totalFundBalanceForMonth = computed(() =>
    roundMoney(this.currentMonthBalances().reduce((sum, b) => sum + (b.balance ?? 0), 0)) ?? 0
  );

  protected readonly historyBalances = computed(() =>
    [...this.service.fundBalances()]
      .filter(b => b.year === this.fundsLocalYear())
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + b.month))
  );

  protected readonly previousFundBalance = computed(() => {
    const fundId = this.selectedFundId();
    if (!fundId) { return null; }
    let pm = this.fundsLocalMonth() - 1;
    let py = this.fundsLocalYear();
    if (pm < 1) { pm = 12; py--; }
    return this.service.getFundBalance(fundId, py, pm)?.balance ?? null;
  });

  constructor() {
    effect(() => {
      const fundId = this.selectedFundId();
      const y = this.fundsLocalYear();
      const m = this.fundsLocalMonth();
      const existing = fundId ? this.service.getFundBalance(fundId, y, m) : undefined;
      this.fundBalanceValue.set(existing?.balance ?? null);
      this.fundsIncomeValue.set(existing?.income ?? null);
      this.fundsContributionValue.set(existing?.contribution ?? null);
      this.fundsWithdrawalValue.set(existing?.expenses ?? null);
    }, { allowSignalWrites: true });

    effect(() => {
      const snapshots = this.service.snapshots();
      const balances = this.currentMonthBalances();
      const total = roundMoney(balances.reduce((sum, b) => sum + (b.balance ?? 0), 0)) ?? 0;
      const totalIncome = roundMoney(balances.reduce((sum, b) => sum + (b.income ?? 0), 0)) ?? 0;
      const totalContribution = roundMoney(balances.reduce((sum, b) => sum + (b.contribution ?? 0), 0)) ?? 0;
      const totalExpenses = roundMoney(balances.reduce((sum, b) => sum + (b.expenses ?? 0), 0)) ?? 0;
      const y = this.fundsLocalYear();
      const m = this.fundsLocalMonth();
      const existing = snapshots.find(s => s.accountId === this.INVESTMENT_ID && s.year === y && s.month === m);

      const hasData = total > 0 || totalIncome > 0 || totalContribution > 0 || totalExpenses > 0;
      const changed = !existing
        ? hasData
        : existing.balance !== total
          || existing.income !== totalIncome
          || existing.contribution !== totalContribution
          || existing.expenses !== totalExpenses;

      if (changed) {
        this.service.upsertSnapshot(this.INVESTMENT_ID, y, m, total, totalIncome, totalExpenses, totalContribution).subscribe();
      }
    }, { allowSignalWrites: true });
  }

  protected getFundName(fundId: string): string {
    return this.funds().find(f => f.id === fundId)?.name ?? fundId;
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
    }).subscribe(() => {
      this.newCode.set('');
      this.newName.set('');
      this.savedFund.set(true);
      setTimeout(() => this.savedFund.set(false), 2000);
    });
  }

  protected deleteFund(fund: MyInvestorFund): void {
    this.service.deleteMyInvestorFund(fund.id).subscribe();
  }

  // --- Balance mensual por fondo ---
  protected saveFundBalance(): void {
    const fundId = this.selectedFundId();
    const bal = this.fundBalanceValue();
    if (!fundId || bal === null) { return; }

    const y = this.fundsLocalYear();
    const m = this.fundsLocalMonth();
    const income = this.fundsIncomeValue() ?? 0;
    const contribution = this.fundsContributionValue() ?? 0;
    const withdrawal = this.fundsWithdrawalValue() ?? 0;

    const existing = this.editingFundBalance() ?? this.service.getFundBalance(fundId, y, m);

    const onSaved = () => {
      this.selectedFundId.set('');
      this.editingFundBalance.set(null);
      this.savedFundBalance.set(true);
      setTimeout(() => this.savedFundBalance.set(false), 2000);
    };

    if (existing) {
      this.service.updateFundBalance(existing.id, { balance: bal, income, contribution, expenses: withdrawal }).subscribe(onSaved);
    } else {
      this.service.addFundBalance({
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fundId,
        year: y,
        month: m,
        balance: bal,
        income,
        contribution,
        expenses: withdrawal,
      }).subscribe(onSaved);
    }
  }

  protected onEditBalance(balance: FundBalance): void {
    this.selectedFundId.set(balance.fundId);
    this.editingFundBalance.set(balance);
    this.fundBalanceValue.set(balance.balance);
    this.fundsIncomeValue.set(balance.income ?? null);
    this.fundsContributionValue.set(balance.contribution ?? null);
    this.fundsWithdrawalValue.set(balance.expenses ?? null);
  }

  protected cancelEditBalance(): void {
    this.selectedFundId.set('');
    this.editingFundBalance.set(null);
  }

  protected deleteFundBalance(balance: { id: string }): void {
    this.service.deleteFundBalance(balance.id).subscribe();
  }
}
