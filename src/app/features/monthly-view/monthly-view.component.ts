import { Component, inject, input, computed, effect } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTHS } from '../../core/constants/date.constants';
import { AccountBreakdownComponent } from './components/account-breakdown/account-breakdown.component';
import { ExpenseCategoryChartComponent } from './components/expense-category-chart/expense-category-chart.component';
import { IncomeBreakdownComponent } from './components/income-breakdown/income-breakdown.component';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';

@Component({
  selector: 'app-monthly-view',
  standalone: true,
  imports: [AccountBreakdownComponent, ExpenseCategoryChartComponent, IncomeBreakdownComponent, MonthPickerComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ title() }}</h1>
          <p class="text-sm text-gray-500">Resumen financiero del mes</p>
        </div>
        <app-month-picker />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-blue-400/10 to-blue-600/10 transition-all duration-300 group-hover:opacity-80"></div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Balance Total</p>
          <p class="mt-1.5 text-xl font-bold text-gray-900">{{ currentSummary().totalBalance.toLocaleString('es-ES') }} €</p>
        </div>
        <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-green-400/10 to-green-600/10 transition-all duration-300 group-hover:opacity-80"></div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Ingresos</p>
          <p class="mt-1.5 text-xl font-bold text-green-600">{{ currentSummary().totalIncome.toLocaleString('es-ES') }} €</p>
        </div>
        <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md">
          <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-red-400/10 to-red-600/10 transition-all duration-300 group-hover:opacity-80"></div>
          <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Gastos</p>
          <p class="mt-1.5 text-xl font-bold text-red-600">{{ currentSummary().totalExpenses.toLocaleString('es-ES') }} €</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div class="xl:col-span-2">
          <app-account-breakdown
            [platforms]="service.platforms()"
            [accounts]="service.accounts()"
            [snapshots]="snapshots()"
            [holdings]="holdings()"
            [expenses]="expenses()"
          />
        </div>
        <div class="space-y-6">
          <app-expense-category-chart [expenses]="expenses()" />
          <app-income-breakdown [incomes]="incomes()" />
        </div>
      </div>
    </div>
  `,
})
export class MonthlyViewComponent {
  readonly year = input<string>('2026');
  readonly month = input<string>('6');

  protected readonly service = inject(FinancialDataService);

  private readonly parsedYear = computed(() => parseInt(this.year(), 10));
  private readonly parsedMonth = computed(() => parseInt(this.month(), 10));

  constructor() {
    effect(() => {
      this.service.currentYear.set(this.parsedYear());
    }, { allowSignalWrites: true });
    effect(() => {
      this.service.currentMonth.set(this.parsedMonth());
    }, { allowSignalWrites: true });
  }

  protected readonly title = computed(() => {
    return `${MONTHS[this.parsedMonth() - 1]} ${this.parsedYear()}`;
  });

  protected readonly snapshots = computed(() =>
    this.service.getSnapshotsByMonth(this.parsedYear(), this.parsedMonth())
  );

  protected readonly currentSummary = computed(() =>
    this.service.getMonthlySummary(this.parsedYear(), this.parsedMonth())
  );

  protected readonly holdings = computed(() => {
    const snapshotIds = this.snapshots().map(s => s.id);
    return this.service.holdings().filter(h => snapshotIds.includes(h.snapshotId));
  });

  protected readonly expenses = computed(() => {
    const snapshotIds = this.snapshots().map(s => s.id);
    return this.service.expenses().filter(e => snapshotIds.includes(e.snapshotId));
  });

  protected readonly incomes = computed(() => {
    const snapshotIds = this.snapshots().map(s => s.id);
    return this.service.incomes().filter(i => snapshotIds.includes(i.snapshotId));
  });
}
