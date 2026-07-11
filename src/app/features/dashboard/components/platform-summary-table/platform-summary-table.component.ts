import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Platform } from '../../../../models/platform';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { Account } from '../../../../models/account';

interface PlatformRow {
  platform: Platform;
  balance: number;
  income: number;
  expenses: number;
  pct: number;
}

@Component({
  selector: 'app-platform-summary-table',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div class="border-b border-gray-100 px-5 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Plataformas</h2>
          <span class="text-xs font-medium text-gray-400">{{ rows().length }} cuentas</span>
        </div>
      </div>
      <div class="divide-y divide-gray-100">
        @for (row of rows(); track row.platform.id) {
          <a [routerLink]="['/platform', row.platform.id]" class="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50/80">
            <span class="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110" [style.background-color]="row.platform.color + '15'">
              <span class="h-2.5 w-2.5 rounded-full" [style.background-color]="row.platform.color"></span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ row.platform.name }}</p>
              <div class="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-gray-100">
                <div class="h-full rounded-full transition-all duration-500" [style.width.%]="row.pct" [style.background-color]="row.platform.color"></div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">{{ row.balance.toLocaleString('es-ES') }} €</p>
              <div class="mt-0.5 flex gap-2 text-xs">
                <span class="text-green-600">{{ row.income > 0 ? '+' + row.income.toLocaleString('es-ES') : '-' }}</span>
                <span class="text-red-600">{{ row.expenses > 0 ? row.expenses.toLocaleString('es-ES') + ' €' : '-' }}</span>
              </div>
            </div>
          </a>
        }
      </div>
    </div>
  `,
})
export class PlatformSummaryTableComponent {
  readonly platforms = input.required<Platform[]>();
  readonly accounts = input.required<Account[]>();
  readonly snapshots = input.required<MonthlySnapshot[]>();

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
        balance: platformSnapshots.reduce((sum, s) => sum + s.balance, 0),
        income: platformSnapshots.reduce((sum, s) => sum + s.income, 0),
        expenses: platformSnapshots.reduce((sum, s) => sum + s.expenses, 0),
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
