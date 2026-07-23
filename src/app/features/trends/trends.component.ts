import { Component, inject, computed } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTHS } from '../../core/constants/date.constants';
import { NetWorthTrendComponent } from './components/net-worth-trend/net-worth-trend.component';
import { IncomeVsExpensesComponent } from './components/income-vs-expenses/income-vs-expenses.component';
import { PlatformDistributionComponent } from './components/platform-distribution/platform-distribution.component';
import { SavingsRateTrendComponent } from './components/savings-rate-trend/savings-rate-trend.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';

@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [NetWorthTrendComponent, IncomeVsExpensesComponent, PlatformDistributionComponent, SavingsRateTrendComponent, CollapsibleDescriptionComponent],
  template: `
    <div class="space-y-6">
      <app-collapsible-description description="Análisis de tendencias a largo plazo: evolución patrimonial, ingresos vs gastos, distribución por plataforma y tasa de ahorro." storageKey="desc-trends" />

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <app-net-worth-trend [labels]="monthsLabels()" [data]="netWorthData()" />
        <app-income-vs-expenses [labels]="monthsLabels()" [incomes]="incomeData()" [expenses]="expenseData()" />
        <app-platform-distribution [items]="distributionData()" />
        <app-savings-rate-trend [labels]="monthsLabels()" [data]="savingsRateData()" />
      </div>
    </div>
  `,
})
export class TrendsComponent {
  protected readonly service = inject(FinancialDataService);

  protected readonly months = computed(() =>
    this.service.getAvailableMonths()
  );

  protected readonly monthsLabels = computed(() =>
    this.months().map(m => `${MONTHS[m.month - 1]} ${m.year}`)
  );

  protected readonly netWorthData = computed(() =>
    this.months().map(m => this.service.getMonthlySummary(m.year, m.month).netWorth)
  );

  protected readonly incomeData = computed(() =>
    this.months().map(m => this.service.getMonthlySummary(m.year, m.month).totalIncome)
  );

  protected readonly expenseData = computed(() =>
    this.months().map(m => this.service.getMonthlySummary(m.year, m.month).totalExpenses)
  );

  protected readonly savingsRateData = computed(() =>
    this.months().map(m => {
      const summary = this.service.getMonthlySummary(m.year, m.month);
      if (summary.totalIncome === 0) { return 0; }
      return Math.round((summary.netSavings / summary.totalIncome) * 100);
    })
  );

  protected readonly distributionData = computed(() => {
    const latest = this.months()[this.months().length - 1];
    if (!latest) { return []; }

    const platforms = this.service.platforms();
    const accounts = this.service.accounts();
    const snapshots = this.service.getSnapshotsByMonth(latest.year, latest.month);

    return platforms.map(p => {
      const platformAccounts = accounts.filter(a => a.platformId === p.id);
      const accountIds = new Set(platformAccounts.map(a => a.id));
      const balance = snapshots
        .filter(s => accountIds.has(s.accountId))
        .reduce((sum, s) => sum + s.balance, 0);

      return { name: p.name, value: balance, color: p.color };
    }).filter(item => item.value > 0);
  });
}
