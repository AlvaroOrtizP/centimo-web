import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MyInvestorFund } from '../../../../models/myinvestor-fund';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';

@Component({
  selector: 'app-myinvestor-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
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

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses obtenidos este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 15"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="metalIncome"
            />
            <p class="mt-0.5 text-xs text-gray-400">Rendimiento obtenido en el mes</p>
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
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 50"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#00A3E0] focus:outline-none focus:ring-1 focus:ring-[#00A3E0]"
              [(ngModel)]="metalWithdrawal"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#00A3E0] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0089C0] disabled:opacity-50"
            [disabled]="!metalBalance()"
            (click)="saveMetal()"
          >{{ editingMetalSnapshot() ? 'Actualizar balance' : 'Guardar balance' }}</button>
          @if (editingMetalSnapshot()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditMetal()"
            >Cancelar</button>
          }
          @if (savedMetal()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <app-snapshot-history-table
        [snapshots]="metalHistory()"
        (edit)="onEditMetal($event)"
        (delete)="onDeleteMetal($event)"
      />

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
                <div class="flex items-center gap-4 text-sm">
                  <p class="text-gray-600">Fondos: <strong class="text-gray-900">{{ totalFundBalanceForMonth().toLocaleString('es-ES') }} €</strong></p>
                  <p class="text-gray-600">Metal: <strong class="text-gray-900">{{ metalBalanceForFundsMonth().toLocaleString('es-ES') }} €</strong></p>
                  <p class="text-gray-600">Total MyInvestor: <strong class="text-[#00A3E0]">{{ totalMyInvestorForMonth().toLocaleString('es-ES') }} €</strong></p>
                </div>
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

        <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
          Balance total fondos: <strong class="text-gray-900">{{ totalFundBalanceForMonth().toLocaleString('es-ES') }} €</strong>
        </div>

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
  protected readonly metalIncome = signal<number | null>(null);
  protected readonly metalContribution = signal<number | null>(null);
  protected readonly metalWithdrawal = signal<number | null>(null);
  protected readonly savedMetal = signal(false);
  protected readonly editingMetalSnapshot = signal<MonthlySnapshot | null>(null);

  protected readonly previousMetalBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.METAL_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly metalHistory = computed(() =>
    this.service.getSnapshotsByAccount(this.METAL_ID)
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
  );

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

  protected readonly metalBalanceForFundsMonth = computed(() =>
    this.service.getSnapshot(this.METAL_ID, this.fundsLocalYear(), this.fundsLocalMonth())?.balance ?? 0
  );

  protected readonly totalMyInvestorForMonth = computed(() =>
    this.totalFundBalanceForMonth() + this.metalBalanceForFundsMonth()
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
      this.service.snapshots();
      const snap = this.service.getSnapshot(this.METAL_ID, this.localYear(), this.localMonth());
      if (this.editingMetalSnapshot()) { return; }
      this.metalBalance.set(snap?.balance ?? null);
      this.metalIncome.set(snap?.income ?? null);
      this.metalContribution.set(snap?.contribution ?? null);
      this.metalWithdrawal.set(snap?.expenses && snap.expenses > 0 ? snap.expenses : null);
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
  protected onEditMetal(snap: MonthlySnapshot): void {
    this.localMonth.set(snap.month);
    this.localYear.set(snap.year);
    this.metalBalance.set(snap.balance);
    this.metalIncome.set(snap.income ?? null);
    this.metalContribution.set(snap.contribution ?? null);
    this.metalWithdrawal.set(snap.expenses && snap.expenses > 0 ? snap.expenses : null);
    this.editingMetalSnapshot.set(snap);
  }

  protected cancelEditMetal(): void {
    this.editingMetalSnapshot.set(null);
    this.metalIncome.set(null);
    this.metalContribution.set(null);
    this.metalWithdrawal.set(null);
  }

  protected onDeleteMetal(id: string): void {
    this.service.deleteSnapshot(id);
    if (this.editingMetalSnapshot()?.id === id) {
      this.cancelEditMetal();
    }
  }

  protected saveMetal(): void {
    const bal = this.metalBalance();
    if (bal === null) { return; }

    const inc = this.metalIncome() ?? 0;
    const contrib = this.metalContribution() ?? 0;
    const withdrawal = this.metalWithdrawal() ?? 0;

    const editing = this.editingMetalSnapshot();
    if (editing) {
      this.service.updateSnapshot(editing.id, {
        balance: bal,
        income: inc,
        contribution: contrib,
        expenses: withdrawal,
      });
      this.cancelEditMetal();
    } else {
      this.service.upsertSnapshot(this.METAL_ID, this.localYear(), this.localMonth(), bal, inc, withdrawal, contrib).subscribe();
    }

    this.metalIncome.set(null);
    this.metalContribution.set(null);
    this.metalWithdrawal.set(null);
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
    const existing = this.service.getFundBalance(fundId, y, m);

    const onSaved = () => {
      this.selectedFundId.set('');
      this.fundBalanceValue.set(null);
      this.savedFundBalance.set(true);
      setTimeout(() => this.savedFundBalance.set(false), 2000);
    };

    if (existing) {
      this.service.updateFundBalance(existing.id, { balance: bal }).subscribe(onSaved);
    } else {
      this.service.addFundBalance({
        id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fundId,
        year: y,
        month: m,
        balance: bal,
      }).subscribe(onSaved);
    }
  }

  protected deleteFundBalance(balance: { id: string }): void {
    this.service.deleteFundBalance(balance.id).subscribe();
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
