import { Component, computed, inject } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { PlatformSummaryTableComponent } from './components/platform-summary-table/platform-summary-table.component';
import { NetWorthChartComponent } from './components/net-worth-chart/net-worth-chart.component';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SummaryCardsComponent, PlatformSummaryTableComponent, NetWorthChartComponent],
  template: `
    <div class="space-y-6">
      <app-summary-cards [summary]="currentSummary()" [previousSummary]="previousSummary()" />
      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <app-platform-summary-table
          [platforms]="service.platforms()"
          [accounts]="service.accounts()"
          [snapshots]="currentSnapshots()"
        />
        <app-net-worth-chart [labels]="chartLabels()" [balanceData]="chartData()" [expensesData]="chartExpensesData()" />
      </div>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly service = inject(FinancialDataService);

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

  protected readonly chartData = computed(() => {
    return this.last6Months().map(({ year, month }) =>
      this.service.getMonthlySummary(year, month).balanceWithoutExpenses
    );
  });

  protected readonly chartExpensesData = computed(() => {
    return this.last6Months().map(({ year, month }) =>
      this.service.getMonthlySummary(year, month).totalExpenses
    );
  });

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
