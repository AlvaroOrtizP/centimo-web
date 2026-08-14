import { Injectable, inject, signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SummariesService } from '../../api/generated/api/summaries.service';
import { MonthlySummary, PlatformMonthlyBalance, PlatformType } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SummaryDataService {
  private readonly summariesApi = inject(SummariesService);
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

    this.summariesApi.getMonthlySummary(year, month).pipe(
      map(s => ({
        year: s.year ?? year,
        month: s.month ?? month,
        totalBalance: s.totalBalance ?? 0,
        totalIncome: s.totalIncome ?? 0,
        totalExpenses: s.totalExpenses ?? 0,
        balanceWithoutExpenses: s.balanceWithoutExpenses ?? 0,
        netWorth: s.netWorth ?? 0,
        netSavings: s.netSavings ?? 0,
      })),
      catchError((err) => {
        this.logger.error('SummaryData', 'loadMonthlySummary error', { year, month }, err);
        return of(null);
      }),
    ).subscribe(summary => {
      if (!summary) { return; }
      this.summariesCache.update(cache => {
        const next = new Map(cache);
        next.set(key, summary);
        return next;
      });
    });
  }

  loadMonthlySummariesRange(year: number, month: number, months: number, force = false): void {
    if (!force && this.monthlySummariesRangeLoaded()) { return; }

    this.summariesApi.getMonthlySummaries(year, month, months).pipe(
      map(list => list.map(s => ({
        year: s.year ?? year,
        month: s.month ?? month,
        totalBalance: s.totalBalance ?? 0,
        totalIncome: s.totalIncome ?? 0,
        totalExpenses: s.totalExpenses ?? 0,
        balanceWithoutExpenses: s.balanceWithoutExpenses ?? 0,
        netWorth: s.netWorth ?? 0,
        netSavings: s.netSavings ?? 0,
      }))),
      catchError((err) => {
        this.logger.error('SummaryData', 'loadMonthlySummariesRange error', { year, month, months }, err);
        return of([]);
      }),
    ).subscribe(summaries => {
      this.summariesCache.update(cache => {
        const next = new Map(cache);
        for (const s of summaries) {
          next.set(`${s.year}-${s.month}`, s);
        }
        return next;
      });
      this.monthlySummariesRangeLoaded.set(true);
    });
  }

  loadPlatformMonthlyBalances(year: number, month: number, months: number, force = false): void {
    if (!force && this.platformBalancesLoaded()) { return; }

    this.summariesApi.getPlatformBalances(year, month, months).pipe(
      map(list => list.map(p => ({
        platformId: p.platformId ?? '',
        platformName: p.platformName ?? '',
        type: (p.type ?? PlatformType.Bank) as unknown as PlatformType,
        color: p.color ?? '',
        icon: p.icon ?? '',
        balances: (p.balances ?? []).map(b => ({
          year: b.year ?? year,
          month: b.month ?? month,
          balance: b.balance ?? 0,
        })),
      }))),
      catchError((err) => {
        this.logger.error('SummaryData', 'loadPlatformMonthlyBalances error', { year, month, months }, err);
        return of([]);
      }),
    ).subscribe(result => {
      this.platformBalances.set(result);
      this.platformBalancesLoaded.set(true);
    });
  }
}
