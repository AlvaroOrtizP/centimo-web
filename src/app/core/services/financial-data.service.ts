import { Injectable, signal, computed } from '@angular/core';

import { Platform } from '../../models/platform';
import { Account } from '../../models/account';
import { MonthlySnapshot } from '../../models/monthly-snapshot';
import { InvestmentHolding } from '../../models/investment-holding';
import { InvestmentTransaction } from '../../models/investment-transaction';
import { CrowdlendingInvestment } from '../../models/crowdlending-investment';
import { Expense } from '../../models/expense';
import { IncomeSource } from '../../models/income-source';
import { MonthlySummary } from '../../models/monthly-summary';

import {
  MOCK_PLATFORMS,
  MOCK_ACCOUNTS,
  MOCK_SNAPSHOTS,
  MOCK_HOLDINGS,
  MOCK_TRADES,
  MOCK_CROWDLENDING,
  MOCK_INCOMES,
  MOCK_EXPENSES,
} from './financial-data.mock';

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  readonly platforms = signal<Platform[]>(MOCK_PLATFORMS);
  readonly accounts = signal<Account[]>(MOCK_ACCOUNTS);
  readonly snapshots = signal<MonthlySnapshot[]>(MOCK_SNAPSHOTS);
  readonly holdings = signal<InvestmentHolding[]>(MOCK_HOLDINGS);
  readonly trades = signal<InvestmentTransaction[]>(MOCK_TRADES);
  readonly crowdlending = signal<CrowdlendingInvestment[]>(MOCK_CROWDLENDING);
  readonly expenses = signal<Expense[]>(MOCK_EXPENSES);
  readonly incomes = signal<IncomeSource[]>(MOCK_INCOMES);

  readonly currentYear = signal(2026);
  readonly currentMonth = signal(6);

  getAccountsByPlatform(platformId: string): Account[] {
    return this.accounts().filter(a => a.platformId === platformId);
  }

  getPlatform(id: string): Platform | undefined {
    return this.platforms().find(p => p.id === id);
  }

  getAccount(id: string): Account | undefined {
    return this.accounts().find(a => a.id === id);
  }

  getSnapshotsByAccount(accountId: string): MonthlySnapshot[] {
    return this.snapshots().filter(s => s.accountId === accountId);
  }

  getSnapshotsByMonth(year: number, month: number): MonthlySnapshot[] {
    return this.snapshots().filter(s => s.year === year && s.month === month);
  }

  getSnapshot(accountId: string, year: number, month: number): MonthlySnapshot | undefined {
    return this.snapshots().find(s => s.accountId === accountId && s.year === year && s.month === month);
  }

  getHoldingsBySnapshot(snapshotId: string): InvestmentHolding[] {
    return this.holdings().filter(h => h.snapshotId === snapshotId);
  }

  getTradesByAccount(accountId: string): InvestmentTransaction[] {
    return this.trades().filter(t => t.accountId === accountId);
  }

  getCrowdlendingByPlatform(platformId: string): CrowdlendingInvestment[] {
    return this.crowdlending().filter(c => c.platformId === platformId);
  }

  getExpensesBySnapshot(snapshotId: string): Expense[] {
    return this.expenses().filter(e => e.snapshotId === snapshotId);
  }

  getIncomesBySnapshot(snapshotId: string): IncomeSource[] {
    return this.incomes().filter(i => i.snapshotId === snapshotId);
  }

  readonly monthlySummary = computed(() => {
    const snapshots = this.getSnapshotsByMonth(this.currentYear(), this.currentMonth());

    const totalBalance = snapshots.reduce((sum, s) => sum + s.balance, 0);
    const totalIncome = snapshots.reduce((sum, s) => sum + s.income, 0);
    const totalExpenses = snapshots.reduce((sum, s) => sum + s.expenses, 0);

    return {
      year: this.currentYear(),
      month: this.currentMonth(),
      totalBalance,
      totalIncome,
      totalExpenses,
      netWorth: totalBalance,
      netSavings: totalIncome - totalExpenses,
    } satisfies MonthlySummary;
  });

  getMonthlySummary(year: number, month: number): MonthlySummary {
    const snapshots = this.getSnapshotsByMonth(year, month);
    const totalBalance = snapshots.reduce((sum, s) => sum + s.balance, 0);
    const totalIncome = snapshots.reduce((sum, s) => sum + s.income, 0);
    const totalExpenses = snapshots.reduce((sum, s) => sum + s.expenses, 0);

    return {
      year,
      month,
      totalBalance,
      totalIncome,
      totalExpenses,
      netWorth: totalBalance,
      netSavings: totalIncome - totalExpenses,
    };
  }

  getPlatformHistory(platformId: string): MonthlySnapshot[] {
    const platformAccounts = this.getAccountsByPlatform(platformId);
    const accountIds = new Set(platformAccounts.map(a => a.id));
    return this.snapshots().filter(s => accountIds.has(s.accountId));
  }

  getAvailableMonths(): { year: number; month: number }[] {
    const unique = new Set<string>();
    const result: { year: number; month: number }[] = [];

    for (const s of this.snapshots()) {
      const key = `${s.year}-${s.month}`;
      if (!unique.has(key)) {
        unique.add(key);
        result.push({ year: s.year, month: s.month });
      }
    }

    return result.sort((a, b) => a.year - b.year || a.month - b.month);
  }

  addSnapshot(snapshot: MonthlySnapshot): void {
    this.snapshots.update(arr => [...arr, snapshot]);
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    this.snapshots.update(arr => arr.map(s => s.id === id ? { ...s, ...data } : s));
  }

  toggleChecklistItem(snapshotId: string, itemId: string): void {
    this.snapshots.update(arr => arr.map(s => {
      if (s.id !== snapshotId || !s.checklistItems) { return s; }
      return {
        ...s,
        checklistItems: s.checklistItems.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };
    }));
  }

  addHolding(holding: InvestmentHolding): void {
    this.holdings.update(arr => [...arr, holding]);
  }

  addExpense(expense: Expense): void {
    this.expenses.update(arr => [...arr, expense]);
  }

  deleteExpense(id: string, snapshotId: string): void {
    const exp = this.expenses().find(e => e.id === id);
    this.expenses.update(arr => arr.filter(e => e.id !== id));
    if (exp) {
      const snap = this.snapshots().find(s => s.id === snapshotId);
      if (snap) {
        this.updateSnapshot(snapshotId, { expenses: Math.max(0, snap.expenses - exp.amount) });
      }
    }
  }

  addIncome(income: IncomeSource): void {
    this.incomes.update(arr => [...arr, income]);
  }

  deleteIncome(id: string, snapshotId: string): void {
    const inc = this.incomes().find(i => i.id === id);
    this.incomes.update(arr => arr.filter(i => i.id !== id));
    if (inc) {
      const snap = this.snapshots().find(s => s.id === snapshotId);
      if (snap) {
        this.updateSnapshot(snapshotId, { income: Math.max(0, snap.income - inc.amount) });
      }
    }
  }

  addTrade(trade: InvestmentTransaction): void {
    this.trades.update(arr => [...arr, trade]);
  }

  deleteTrade(id: string): void {
    this.trades.update(arr => arr.filter(t => t.id !== id));
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): void {
    this.crowdlending.update(arr => [...arr, investment]);
  }

  deleteCrowdlendingInvestment(id: string): void {
    this.crowdlending.update(arr => arr.filter(c => c.id !== id));
  }

  deleteSnapshot(id: string): void {
    this.snapshots.update(arr => arr.filter(s => s.id !== id));
  }

  deleteHolding(id: string): void {
    this.holdings.update(arr => arr.filter(h => h.id !== id));
  }
}
