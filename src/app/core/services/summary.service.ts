import { Injectable, inject, signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// import { SummariesService } from '../../api/generated/api/summaries.service'; // TODO(BACKEND): API comentada, solo queda B100
import { MonthlySummary, PlatformMonthlyBalance, PlatformType } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SummaryDataService {
  // private readonly summariesApi = inject(SummariesService);
  private readonly logger = inject(LoggerService);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);

  private readonly summariesCache = signal<Map<string, MonthlySummary>>(new Map());
  private readonly monthlySummariesRangeLoaded = signal(false);

  private readonly platformBalances = signal<PlatformMonthlyBalance[]>([]);
  private readonly platformBalancesLoaded = signal(false);

  readonly platformMonthlyBalances = this.platformBalances.asReadonly();

  getMonthlySummary(year: number, month: number): MonthlySummary {
    const key = `${year}-${month}`;
    const cached = this.summariesCache().get(key);
    if (cached) { return cached; }

    return {
      year,
      month,
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      balanceWithoutExpenses: 0,
      netWorth: 0,
      netSavings: 0,
    };
  }

  readonly monthlySummary = computed(() =>
    this.getMonthlySummary(this.currentYear(), this.currentMonth())
  );

  loadMonthlySummary(year: number, month: number): void {
    const key = `${year}-${month}`;
    if (this.summariesCache().has(key)) { return; }

    // TODO(BACKEND): llamada a GET /summaries/monthly comentada.
    // this.summariesApi.getMonthlySummary(year, month).pipe(
    //   ...
    // ).subscribe(summary => { ... });
  }

  loadMonthlySummariesRange(year: number, month: number, months: number, force = false): void {
    if (!force && this.monthlySummariesRangeLoaded()) { return; }

    // TODO(BACKEND): llamada a GET /summaries (rango) comentada.
    // this.summariesApi.getMonthlySummaries(year, month, months).pipe(
    //   ...
    // ).subscribe(summaries => { ... });
  }

  loadPlatformMonthlyBalances(year: number, month: number, months: number, force = false): void {
    if (!force && this.platformBalancesLoaded()) { return; }

    // TODO(BACKEND): llamada a GET /summaries/platform-balances comentada.
    // this.summariesApi.getPlatformBalances(year, month, months).pipe(
    //   ...
    // ).subscribe(result => { ... });
  }
}
