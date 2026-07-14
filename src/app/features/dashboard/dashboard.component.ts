import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTHS } from '../../core/constants/date.constants';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { PlatformSummaryTableComponent } from './components/platform-summary-table/platform-summary-table.component';
import { NetWorthChartComponent, ChartDataset } from './components/net-worth-chart/net-worth-chart.component';
import { ExpensesChartComponent } from './components/expenses-chart/expenses-chart.component';

type ChartMode = 'total' | 'per-platform';
type PlatformGroup = 'all' | 'liquidez' | 'fija' | 'variable';

const PLATFORM_GROUPS: Record<string, string[]> = {
  liquidez: ['bbva', 'b100', 'revolut', 'caixabank'],
  fija: ['mintos', 'equito', 'urbanitae'],
  variable: ['myinvestor', 'etoro', 'bitvavo'],
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, SummaryCardsComponent, PlatformSummaryTableComponent, NetWorthChartComponent, ExpensesChartComponent],
  template: `
    <div class="space-y-6">
      <app-summary-cards [summary]="currentSummary()" [previousSummary]="previousSummary()" />
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <app-platform-summary-table
          [platforms]="service.platforms()"
          [accounts]="service.accounts()"
          [snapshots]="currentSnapshots()"
          [selectedPlatformId]="selectedPlatformId()"
          (platformClick)="onPlatformClick($event)"
        />
        <div class="space-y-6">
          <app-net-worth-chart
            [labels]="chartLabels()"
            [datasets]="chartDatasets()"
            [platformColor]="selectedPlatformColor()"
            [selectedPlatformName]="selectedPlatformName()"
            (clearSelection)="selectedPlatformId.set(null)"
          >
            <div actions class="flex items-center gap-2">
              <select
                class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 focus:border-gray-300 focus:outline-none"
                [(ngModel)]="chartMode"
              >
                <option value="total">Total</option>
                <option value="per-platform">Por plataforma</option>
              </select>
              @if (chartMode() === 'per-platform') {
                <select
                  class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 focus:border-gray-300 focus:outline-none"
                  [(ngModel)]="chartGroupFilter"
                >
                  <option value="all">Todas</option>
                  <option value="liquidez">Liquidez</option>
                  <option value="fija">Fija</option>
                  <option value="variable">Variable</option>
                </select>
              }
            </div>
          </app-net-worth-chart>
          <app-expenses-chart
            [labels]="chartLabels()"
            [data]="chartExpensesData()"
            [platformColor]="selectedPlatformColor()"
            [selectedPlatformName]="selectedPlatformName()"
          />
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly service = inject(FinancialDataService);
  protected readonly selectedPlatformId = signal<string | null>(null);
  protected readonly chartMode = signal<ChartMode>('total');
  protected readonly chartGroupFilter = signal<PlatformGroup>('all');

  protected readonly currentSnapshots = computed(() =>
    this.service.getSnapshotsByMonth(this.service.currentYear(), this.service.currentMonth())
  );

  protected readonly currentSummary = computed(() =>
    this.service.monthlySummary()
  );

  protected readonly previousSummary = computed(() => {
    const { year, month } = this.previousMonth();
    return this.service.getMonthlySummary(year, month);
  });

  protected readonly chartLabels = computed(() => {
    return this.last6Months().map(({ year, month }) => `${MONTHS[month - 1]} ${year}`);
  });

  protected readonly chartDatasets = computed<ChartDataset[]>(() => {
    const platformId = this.selectedPlatformId();
    const mode = this.chartMode();
    const group = this.chartGroupFilter();
    const months = this.last6Months();

    if (platformId) {
      const platform = this.service.getPlatform(platformId);
      return [{
        label: platform?.name ?? platformId,
        data: months.map(({ year, month }) => this.getPlatformBalanceForMonth(platformId, year, month)),
        color: platform?.color ?? '#3B82F6',
      }];
    }

    if (mode === 'total') {
      return [{
        label: 'Patrimonio',
        data: months.map(({ year, month }) => this.service.getMonthlySummary(year, month).balanceWithoutExpenses),
        color: '#3B82F6',
      }];
    }

    const platformIds = group === 'all'
      ? this.service.platforms().filter(p => p.id !== 'gastos').map(p => p.id)
      : PLATFORM_GROUPS[group] ?? [];

    return platformIds.map(id => {
      const platform = this.service.getPlatform(id);
      return {
        label: platform?.name ?? id,
        data: months.map(({ year, month }) => this.getPlatformBalanceForMonth(id, year, month)),
        color: platform?.color ?? '#6B7280',
      };
    });
  });

  protected readonly chartExpensesData = computed(() => {
    const platformId = this.selectedPlatformId();
    if (platformId) {
      return this.last6Months().map(({ year, month }) => {
        let cumulative = 0;
        for (let m = 1; m <= month; m++) {
          cumulative += this.getPlatformExpensesForMonth(platformId, year, m);
        }
        return cumulative;
      });
    }
    return this.last6Months().map(({ year, month }) => {
      let cumulative = 0;
      for (let m = 1; m <= month; m++) {
        cumulative += this.service.getMonthlySummary(year, m).totalExpenses;
      }
      return cumulative;
    });
  });

  protected readonly selectedPlatformColor = computed(() => {
    const platformId = this.selectedPlatformId();
    if (!platformId) { return ''; }
    return this.service.getPlatform(platformId)?.color ?? '';
  });

  protected readonly selectedPlatformName = computed(() => {
    const platformId = this.selectedPlatformId();
    if (!platformId) { return ''; }
    return this.service.getPlatform(platformId)?.name ?? '';
  });

  onPlatformClick(platformId: string): void {
    this.selectedPlatformId.update(current => current === platformId ? null : platformId);
  }

  private getPlatformBalanceForMonth(platformId: string, year: number, month: number): number {
    const accounts = this.service.getAccountsByPlatform(platformId);
    const accountIds = new Set(accounts.map(a => a.id));
    const snapshots = this.service.getSnapshotsByMonth(year, month);
    return snapshots.filter(s => accountIds.has(s.accountId)).reduce((sum, s) => sum + s.balance, 0);
  }

  private getPlatformExpensesForMonth(platformId: string, year: number, month: number): number {
    const accounts = this.service.getAccountsByPlatform(platformId);
    const accountIds = new Set(accounts.map(a => a.id));
    const snapshots = this.service.getSnapshotsByMonth(year, month);
    return snapshots.filter(s => accountIds.has(s.accountId)).reduce((sum, s) => sum + s.expenses, 0);
  }

  private last6Months(): { year: number; month: number }[] {
    const result: { year: number; month: number }[] = [];
    let y = this.service.currentYear();
    let m = this.service.currentMonth();

    for (let i = 0; i < 6; i++) {
      result.unshift({ year: y, month: m });
      m--;
      if (m === 0) { m = 12; y--; }
    }

    return result;
  }

  private previousMonth(): { year: number; month: number } {
    let y = this.service.currentYear();
    let m = this.service.currentMonth() - 1;
    if (m === 0) { m = 12; y--; }
    return { year: y, month: m };
  }
}
