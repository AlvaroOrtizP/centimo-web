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

        @if (isInvestmentPlatform()) {
          <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div class="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div class="border-b border-gray-100 px-5 py-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-base font-semibold text-gray-900">Trades</h2>
                  @if (trades().length > 0) {
                    <span class="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">{{ trades().length }}</span>
                  }
                </div>
              </div>
              @if (trades().length === 0) {
                <div class="flex flex-col items-center gap-2 py-10 text-sm text-gray-400">
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
                    <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Sin operaciones registradas
                </div>
              } @else {
                <div class="divide-y divide-gray-100">
                  @for (t of trades(); track t.id) {
                    <div class="px-5 py-3.5 text-sm transition-colors hover:bg-gray-50/50">
                      <div class="flex items-center gap-2">
                        <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          [class.bg-emerald-100]="t.type === 'buy'"
                          [class.text-emerald-800]="t.type === 'buy'"
                          [class.bg-red-100]="t.type === 'sell'"
                          [class.text-red-800]="t.type === 'sell'"
                        >
                          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline [attr.points]="t.type === 'buy' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                          </svg>
                          {{ t.type === 'buy' ? 'COMPRA' : 'VENTA' }}
                        </span>
                        <span class="font-semibold text-gray-900">{{ t.assetName }}</span>
                        <span class="text-gray-500">{{ t.buyQuantity }} × {{ t.buyPricePerUnit.toLocaleString('es-ES') }} €</span>
                        <span class="ml-auto rounded-full px-2 py-0.5 text-xs font-medium"
                          [class.bg-yellow-100]="t.status === 'open'"
                          [class.text-yellow-700]="t.status === 'open'"
                          [class.bg-gray-100]="t.status === 'closed'"
                          [class.text-gray-600]="t.status === 'closed'"
                        >{{ t.status === 'open' ? 'Abierta' : 'Cerrada' }}</span>
                      </div>
                      <div class="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <span>Compra: {{ t.buyDate }}</span>
                        @if (t.sellDate) {
                          <span>Venta: {{ t.sellDate }}</span>
                        }
                        @if (t.pnl != null) {
                          <span [class.text-emerald-600]="t.pnl >= 0" [class.text-red-600]="t.pnl < 0" class="font-semibold">
                            P&L: {{ t.pnl >= 0 ? '+' : '' }}{{ t.pnl.toLocaleString('es-ES') }} €
                          </span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
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

  protected readonly isInvestmentPlatform = computed(() =>
    this.accounts().some(a => a.type === 'investment')
  );

  protected readonly trades = computed(() =>
    this.accounts().flatMap(a => this.service.getTradesByAccount(a.id))
  );
}
