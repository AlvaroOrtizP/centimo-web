import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { TradeSummaryComponent, TradeTotals } from './components/trade-summary/trade-summary.component';
import { TradeTableComponent } from './components/trade-table/trade-table.component';
import { TradeFormComponent } from '../entry-form/components/trade-form/trade-form.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';

type Tab = 'entrada' | 'historial';

interface TabConfig {
  key: Tab;
  label: string;
}

@Component({
  selector: 'app-trade-log',
  standalone: true,
  imports: [FormsModule, TradeSummaryComponent, TradeTableComponent, TradeFormComponent, CollapsibleDescriptionComponent],
  template: `
    <div class="space-y-6">
      <app-collapsible-description description="Registro y entrada de operaciones de inversión con filtros por activo, estado y plataforma." storageKey="desc-trades" />

      <div class="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
        <div class="bg-gray-50/60 px-4 pt-3">
          <div class="flex gap-1">
            @for (tab of tabs; track tab.key) {
              <button
                class="relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
                [class.bg-violet-600 text-white shadow-sm]="activeTab() === tab.key"
                [class.text-gray-500 hover:bg-gray-100 hover:text-gray-700]="activeTab() !== tab.key"
                (click)="activeTab.set(tab.key)"
              >
                {{ tab.label }}
              </button>
            }
          </div>
        </div>
        <div class="h-0.5 bg-violet-600"></div>
        <div class="p-5">
          @switch (activeTab()) {
            @case ('entrada') {
              <app-collapsible-description description="Registra compras de cripto en Bitvavo. Define el activo, precio, cantidad y fecha de la operación." storageKey="desc-trades-entry" />
              <app-trade-form />
            }
            @case ('historial') {
              <div class="space-y-4">
                <app-trade-summary [totals]="totals()" />

                <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div class="flex flex-wrap items-center gap-3">
                    <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                      </svg>
                      <select
                        aria-label="Filtrar por activo"
                        class="bg-transparent text-sm text-gray-700 outline-none"
                        [(ngModel)]="filterAsset"
                      >
                        <option value="">Todos los activos</option>
                        @for (asset of availableAssets(); track asset) {
                          <option [value]="asset">{{ asset }}</option>
                        }
                      </select>
                    </div>

                    <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <select
                        aria-label="Filtrar por estado"
                        class="bg-transparent text-sm text-gray-700 outline-none"
                        [(ngModel)]="filterStatus"
                      >
                        <option value="">Todos los estados</option>
                        <option value="open">Abiertas</option>
                        <option value="closed">Cerradas</option>
                      </select>
                    </div>

                    <div class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
                        <rect width="18" height="14" x="3" y="3" rx="2"/><line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                      <select
                        aria-label="Filtrar por plataforma"
                        class="bg-transparent text-sm text-gray-700 outline-none"
                        [(ngModel)]="filterPlatform"
                      >
                        <option value="">Todas las plataformas</option>
                        @for (p of availablePlatforms(); track p.id) {
                          <option [value]="p.id">{{ p.name }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <app-trade-table [trades]="filteredTrades()" (delete)="deleteTrade($event)" />
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class TradeLogComponent {
  protected readonly service = inject(FinancialDataService);

  protected readonly activeTab = signal<Tab>('historial');

  protected readonly tabs: TabConfig[] = [
    { key: 'entrada', label: 'Entrada' },
    { key: 'historial', label: 'Historial' },
  ];

  protected readonly filterAsset = signal('');
  protected readonly filterStatus = signal('');
  protected readonly filterPlatform = signal('');

  protected readonly allTrades = computed(() => this.service.trades());

  protected readonly availableAssets = computed(() => {
    const assets = new Set(this.allTrades().map(t => t.assetName));
    return Array.from(assets).sort();
  });

  protected readonly availablePlatforms = computed(() => {
    const tradeAccountIds = new Set(this.allTrades().map(t => t.accountId));
    const platformIds = new Set(
      this.service.accounts()
        .filter(a => tradeAccountIds.has(a.id))
        .map(a => a.platformId)
    );
    return this.service.platforms().filter(p => platformIds.has(p.id));
  });

  protected readonly filteredTrades = computed(() => {
    let trades = this.allTrades();

    const asset = this.filterAsset();
    if (asset) {
      trades = trades.filter(t => t.assetName === asset);
    }

    const status = this.filterStatus();
    if (status) {
      trades = trades.filter(t => t.status === status);
    }

    const platformId = this.filterPlatform();
    if (platformId) {
      const platformAccountIds = new Set(
        this.service.accounts()
          .filter(a => a.platformId === platformId)
          .map(a => a.id)
      );
      trades = trades.filter(t => platformAccountIds.has(t.accountId));
    }

    return trades;
  });

  protected readonly totals = computed<TradeTotals>(() => {
    const trades = this.allTrades();
    const accounts = this.service.accounts();
    const platforms = this.service.platforms();

    const totalInvested = trades.reduce((sum, t) => sum + t.buyTotalCost, 0);
    const totalWithdrawn = trades.reduce((sum, t) => sum + (t.sellTotalReceived ?? 0), 0);
    const globalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

    const platformMap = new Map<string, { name: string; color: string; pnl: number }>();

    for (const trade of trades) {
      if (trade.pnl == null) { continue; }
      const account = accounts.find(a => a.id === trade.accountId);
      if (!account) { continue; }
      const platform = platforms.find(p => p.id === account.platformId);
      if (!platform) { continue; }

      const existing = platformMap.get(platform.id);
      if (existing) {
        existing.pnl += trade.pnl;
      } else {
        platformMap.set(platform.id, { name: platform.name, color: platform.color, pnl: trade.pnl });
      }
    }

    return {
      totalInvested,
      totalWithdrawn,
      globalPnl,
      platformPnl: Array.from(platformMap.values()).sort((a, b) => b.pnl - a.pnl),
    };
  });

  protected deleteTrade(id: string): void {
    this.service.deleteTrade(id);
  }
}
