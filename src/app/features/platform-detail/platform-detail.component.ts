import { Component, inject, input, computed } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTHS } from '../../core/constants/date.constants';
import { BalanceHistoryChartComponent } from './components/balance-history-chart/balance-history-chart.component';
import { MonthlyTableComponent } from './components/monthly-table/monthly-table.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';

@Component({
  selector: 'app-platform-detail',
  standalone: true,
  imports: [BalanceHistoryChartComponent, MonthlyTableComponent, CollapsibleDescriptionComponent],
  template: `
    @if (platform(); as p) {
      <div class="space-y-6">
        <app-collapsible-description description="Detalle de cuenta con historial de saldos y operaciones recientes." storageKey="desc-platform" />

        <div class="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl" [style.background-color]="p.color + '15'">
            <span class="h-4 w-4 rounded-full" [style.background-color]="p.color"></span>
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ p.name }}</h1>
            <p class="text-sm text-gray-500 capitalize">{{ p.type }}</p>
          </div>
          <div class="ml-auto flex items-center gap-2 text-sm">
            <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">{{ accounts().length }} cuentas</span>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6">
          <app-balance-history-chart
            [labels]="chartLabels()"
            [data]="chartData()"
            [color]="p.color"
          />
          <app-monthly-table [snapshots]="snapshots()" />
        </div>
      </div>
    } @else {
      <div class="flex h-64 items-center justify-center">
        <div class="text-center">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-gray-300">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          <p class="mt-2 text-gray-400">Plataforma no encontrada</p>
        </div>
      </div>
    }
  `,
})
export class PlatformDetailComponent {
  readonly id = input<string>('');

  protected readonly service = inject(FinancialDataService);

  protected readonly platform = computed(() =>
    this.service.getPlatform(this.id())
  );

  protected readonly accounts = computed(() =>
    this.service.getAccountsByPlatform(this.id())
  );

  protected readonly snapshots = computed(() => {
    const accountIds = new Set(this.accounts().map(a => a.id));
    return this.service.snapshots()
      .filter(s => accountIds.has(s.accountId))
      .sort((a, b) => a.year - b.year || a.month - b.month);
  });

  protected readonly chartLabels = computed(() =>
    this.snapshots().map(s => `${MONTHS[s.month - 1]} ${s.year}`)
  );

  protected readonly chartData = computed(() =>
    this.snapshots().map(s => s.balance)
  );
}
