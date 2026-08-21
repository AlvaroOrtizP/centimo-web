import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Platform } from '../../../../models/platform';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { PlatformMonthlyBalance } from '../../../../models/platform-monthly-balance';
import { EXPENSES_PLATFORM_ID, PLATFORM_GROUPS } from '../../../../core/constants/platform.constants';
import { Account } from '../../../../models/account';

type PlatformFilter = 'all' | 'liquidez' | 'fija' | 'variable';

interface PlatformRow {
  platform: Platform;
  balance: number;
  income: number;
  pct: number;
}

@Component({
  selector: 'app-platform-summary-table',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-lg transition-shadow duration-200 hover:shadow-xl">
      <div class="border-b border-gray-100 px-4 py-3 lg:px-5 lg:py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900 sm:text-base">Plataformas</h2>
          <div class="flex items-center gap-3">
            <select
              aria-label="Filtrar plataformas"
              class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 focus:border-gray-300 focus:outline-none"
              [(ngModel)]="filter"
            >
              <option value="all">Todas</option>
              <option value="liquidez">Liquidez</option>
              <option value="fija">Fija</option>
              <option value="variable">Variable</option>
            </select>
            <span class="text-xs font-medium text-gray-400">{{ filteredRows().length }} cuentas</span>
          </div>
        </div>
      </div>
      <div class="divide-y divide-gray-100">
        @for (row of filteredRows(); track row.platform.id) {
          <div
            class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/80 lg:gap-4 lg:px-5 lg:py-3.5"
            [class.cursor-pointer]="row.platform.id !== EXPENSES_PLATFORM_ID"
            [class.ring-2]="selectedPlatformId() === row.platform.id"
            [class.ring-gray-300]="selectedPlatformId() === row.platform.id"
            (click)="row.platform.id !== EXPENSES_PLATFORM_ID && platformClick.emit(row.platform.id)"
          >
            <span class="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 lg:h-8 lg:w-8" [style.background-color]="row.platform.color + '15'">
              <span class="h-2.5 w-2.5 rounded-full" [style.background-color]="row.platform.color"></span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium text-gray-900 sm:text-sm">{{ row.platform.name }}</p>
              <div class="mt-1 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-gray-100 sm:max-w-[120px]">
                <div class="h-full rounded-full transition-all duration-500" [style.width.%]="row.pct" [style.background-color]="row.platform.color"></div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[13px] font-semibold text-gray-900 sm:text-sm">{{ row.balance.toLocaleString('es-ES') }} €</p>
              <div class="mt-0.5 flex gap-2 text-[11px] sm:text-xs">
                <span class="text-green-600">{{ row.income > 0 ? '+' + row.income.toLocaleString('es-ES') : '-' }}</span>
              </div>
            </div>
          </div>
        }
        <div class="flex items-center gap-3 px-4 py-3 lg:gap-4 lg:px-5 lg:py-3.5">
          <span class="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 lg:h-8 lg:w-8">
            <span class="h-2.5 w-2.5 rounded-full bg-red-500"></span>
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-gray-900 sm:text-sm">Gastos</p>
          </div>
          <div class="text-right">
            <p class="text-[13px] font-semibold text-red-600 sm:text-sm">{{ totalExpenses().toLocaleString('es-ES') }} €</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PlatformSummaryTableComponent {
  protected readonly EXPENSES_PLATFORM_ID = EXPENSES_PLATFORM_ID;

  readonly platforms = input.required<Platform[]>();
  readonly accounts = input.required<Account[]>();
  readonly snapshots = input.required<MonthlySnapshot[]>();
  readonly selectedPlatformId = input<string | null>(null);
  readonly platformMonthlyBalances = input<PlatformMonthlyBalance[]>([]);
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  readonly platformClick = output<string>();

  protected readonly filter = signal<PlatformFilter>('all');

  protected readonly totalExpenses = computed(() =>
    this.snapshots().reduce((sum, s) => sum + s.expenses, 0)
  );

  protected readonly balanceLookup = computed(() => {
    const map = new Map<string, number>();
    const year = this.year();
    const month = this.month();
    for (const p of this.platformMonthlyBalances()) {
      const entry = p.balances.find(b => b.year === year && b.month === month);
      if (entry) { map.set(p.platformId, entry.balance); }
    }
    return map;
  });

  protected readonly filteredRows = computed(() => {
    const allRows = this.rows();
    const f = this.filter();
    if (f === 'all') { return allRows; }
    const allowedIds = new Set(PLATFORM_GROUPS[f] ?? []);
    return allRows.filter(r => allowedIds.has(r.platform.id));
  });

  protected rows = () => {
    const platforms = this.platforms();
    const allAccounts = this.accounts();
    const allSnapshots = this.snapshots();

    const rows: PlatformRow[] = platforms.map(platform => {
      const platformAccounts = allAccounts.filter(a => a.platformId === platform.id);
      const accountIds = new Set(platformAccounts.map(a => a.id));
      const platformSnapshots = allSnapshots.filter(s => accountIds.has(s.accountId));

      return {
        platform,
        balance: this.balanceLookup().get(platform.id) ?? platformSnapshots.reduce((sum, s) => sum + s.balance, 0),
        income: platformSnapshots.reduce((sum, s) => sum + s.income, 0),
        pct: 0,
      };
    });

    const maxBalance = Math.max(...rows.map(r => r.balance), 1);
    for (const row of rows) {
      row.pct = (row.balance / maxBalance) * 100;
    }

    return rows;
  };
}
