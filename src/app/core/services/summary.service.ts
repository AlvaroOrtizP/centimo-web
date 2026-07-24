import { Injectable, inject, signal, computed } from '@angular/core';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SummariesService } from '../../api/generated/api/summaries.service';
import { MonthlySummary } from '../../models/monthly-summary';

@Injectable({ providedIn: 'root' })
export class SummaryDataService {
  private readonly summariesApi = inject(SummariesService);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);

  private readonly summariesCache = signal<Map<string, MonthlySummary>>(new Map());

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
        console.error('[SummaryData] loadMonthlySummary error', { year, month }, err);
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
}
