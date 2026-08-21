import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTHS } from '../../core/constants/date.constants';
import { EXPENSES_PLATFORM_ID, PLATFORM_GROUPS } from '../../core/constants/platform.constants';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { PlatformSummaryTableComponent } from './components/platform-summary-table/platform-summary-table.component';
import { NetWorthChartComponent, ChartDataset } from './components/net-worth-chart/net-worth-chart.component';
import { ExpensesChartComponent } from './components/expenses-chart/expenses-chart.component';

type ChartMode = 'total' | 'per-platform';
type PlatformGroup = 'all' | 'liquidez' | 'fija' | 'variable';
type ExpensesMode = 'acumulado' | 'mensual';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CollapsibleDescriptionComponent, SummaryCardsComponent, PlatformSummaryTableComponent, NetWorthChartComponent, ExpensesChartComponent, MonthPickerComponent],
  template: `
    <div class="space-y-4 lg:space-y-6">
      <app-collapsible-description description="Resumen general de tu patrimonio, distribución por plataformas y evolución en los últimos meses." storageKey="desc-dashboard" />
      <div class="flex justify-end items-center gap-3">
        <button
          type="button"
          title="resetear datos cache"
          class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          (click)="service.refreshCachedData()"
        >Resetear cache</button>
        @if (selectedPlatformId()) {
          <div class="flex items-center gap-1.5 rounded-lg border border-[#00A3E0] bg-[#00A3E0]/5 px-2.5 py-1 text-xs font-medium text-[#00A3E0]">
            <span class="max-w-[140px] truncate">{{ selectedPlatformName() }}</span>
            <button
              type="button"
              class="font-semibold underline-offset-2 hover:underline"
              (click)="resetView()"
            >Ver todo</button>
          </div>
        }
        <app-month-picker />
      </div>
      <app-summary-cards [summary]="currentSummary()" [previousSummary]="previousSummary()" />
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        <app-platform-summary-table
          [platforms]="service.platforms()"
          [accounts]="service.accounts()"
          [snapshots]="currentSnapshots()"
          [platformMonthlyBalances]="service.platformMonthlyBalances()"
          [year]="viewYear()"
          [month]="viewMonth()"
          [selectedPlatformId]="selectedPlatformId()"
          (platformClick)="onPlatformClick($event)"
        />
        <div class="space-y-4 lg:space-y-6">
          <app-net-worth-chart
            [labels]="chartLabels()"
            [datasets]="chartDatasets()"
            [platformColor]="selectedPlatformColor()"
            [selectedPlatformName]="selectedPlatformName()"
            (clearSelection)="selectedPlatformId.set(null)"
          >
            <div actions class="flex items-center gap-2">
              <select
                aria-label="Modo de gráfico"
                class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 focus:border-gray-300 focus:outline-none"
                [(ngModel)]="chartMode"
              >
                <option value="total">Total</option>
                <option value="per-platform">Por plataforma</option>
              </select>
              @if (chartMode() === 'per-platform') {
                <select
                  aria-label="Filtrar por grupo"
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
            [title]="expensesTitle()"
          >
            <div actions class="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                type="button"
                class="rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors"
                [class.bg-white]="expensesMode() === 'acumulado'"
                [class.shadow-sm]="expensesMode() === 'acumulado'"
                [class.text-gray-900]="expensesMode() === 'acumulado'"
                [class.text-gray-500]="expensesMode() !== 'acumulado'"
                (click)="expensesMode.set('acumulado')"
              >Acumulados</button>
              <button
                type="button"
                class="rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors"
                [class.bg-white]="expensesMode() === 'mensual'"
                [class.shadow-sm]="expensesMode() === 'mensual'"
                [class.text-gray-900]="expensesMode() === 'mensual'"
                [class.text-gray-500]="expensesMode() !== 'mensual'"
                (click)="expensesMode.set('mensual')"
              >Por mes</button>
            </div>
          </app-expenses-chart>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly service = inject(FinancialDataService);
  protected readonly viewYear = computed(() => this.service.currentYear());
  protected readonly viewMonth = computed(() => this.service.currentMonth());
  protected readonly selectedPlatformId = signal<string | null>(null);
  protected readonly chartMode = signal<ChartMode>('total');
  protected readonly chartGroupFilter = signal<PlatformGroup>('all');
  protected readonly expensesMode = signal<ExpensesMode>('mensual');

  constructor() {
    effect(() => {
      const year = this.service.currentYear();
      const month = this.service.currentMonth();

      // Recarga el resumen del mes visualizado y de la ventana de 6 meses de los gráficos.
      for (const { year: y, month: m } of this.last6Months()) {
        this.service.loadMonthlySummary(y, m);
      }
      this.service.loadPlatformMonthlyBalances(year, month, 6, true);
      this.service.loadFundBalances(year, month);
    }, { allowSignalWrites: true });
  }

  protected readonly currentSnapshots = computed(() =>
    this.service.getSnapshotsByMonth(this.viewYear(), this.viewMonth())
  );

  protected readonly currentSummary = computed(() =>
    this.service.getMonthlySummary(this.viewYear(), this.viewMonth())
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
      ? this.service.platforms().filter(p => p.id !== EXPENSES_PLATFORM_ID).map(p => p.id)
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
    const cumulative = this.expensesMode() === 'acumulado';
    const monthlyExpenses = (year: number, month: number) => {
      if (platformId) {
        return this.getPlatformExpensesForMonth(platformId, year, month);
      }
      return this.service.getMonthlySummary(year, month).totalExpenses;
    };

    return this.last6Months().map(({ year, month }) => {
      if (!cumulative) {
        return monthlyExpenses(year, month);
      }
      let cumulativeTotal = 0;
      for (let m = 1; m <= month; m++) {
        cumulativeTotal += monthlyExpenses(year, m);
      }
      return cumulativeTotal;
    });
  });

  protected readonly expensesTitle = computed(() =>
    this.expensesMode() === 'acumulado' ? 'Gastos Acumulados' : 'Gastos por Mes'
  );

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

  resetView(): void {
    this.selectedPlatformId.set(null);
    this.chartMode.set('total');
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
    let y = this.viewYear();
    let m = this.viewMonth();

    for (let i = 0; i < 6; i++) {
      result.unshift({ year: y, month: m });
      m--;
      if (m === 0) { m = 12; y--; }
    }

    return result;
  }

  private previousMonth(): { year: number; month: number } {
    let y = this.viewYear();
    let m = this.viewMonth() - 1;
    if (m === 0) { m = 12; y--; }
    return { year: y, month: m };
  }
}
