import { Injectable, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Platform } from '../../models/platform';
import { Account } from '../../models/account';
import { MonthlySnapshot } from '../../models/monthly-snapshot';
import { EXPENSES_PLATFORM_ID } from '../constants/platform.constants';
import { InvestmentHolding } from '../../models/investment-holding';
import { InvestmentTransaction } from '../../models/investment-transaction';
import { CrowdlendingInvestment } from '../../models/crowdlending-investment';
import { MyInvestorFund } from '../../models/myinvestor-fund';
import { FundBalance } from '../../models/fund-balance';
import { Expense } from '../../models/expense';
import { IncomeSource } from '../../models/income-source';
import { MonthlySummary } from '../../models/monthly-summary';
import { SalaryAllocation } from '../../models/salary-allocation';
import { Commitment } from '../../models/commitment';
import { Alert } from '../../models/alert';

import SNAPSHOTS from '../../../assets/data/snapshots.json';
import HOLDINGS from '../../../assets/data/holdings.json';
import TRADES from '../../../assets/data/trades.json';
import INCOMES from '../../../assets/data/incomes.json';
import EXPENSES from '../../../assets/data/expenses.json';
import CROWDLENDING from '../../../assets/data/crowdlending.json';
import MYINVESTOR_FUNDS from '../../../assets/data/myinvestor-funds.json';
import FUND_BALANCES from '../../../assets/data/fund-balances.json';
import SALARY_ALLOCATIONS from '../../../assets/data/salary-allocations.json';
import COMMITMENTS from '../../../assets/data/commitments.json';
import ALERTS from '../../../assets/data/alerts.json';

const API_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class FinancialDataService implements OnInit {
  private readonly http = inject(HttpClient);

  readonly platforms = signal<Platform[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly snapshots = signal<MonthlySnapshot[]>(SNAPSHOTS as MonthlySnapshot[]);
  readonly holdings = signal<InvestmentHolding[]>(HOLDINGS as InvestmentHolding[]);
  readonly trades = signal<InvestmentTransaction[]>(TRADES as InvestmentTransaction[]);
  readonly crowdlending = signal<CrowdlendingInvestment[]>(CROWDLENDING as CrowdlendingInvestment[]);
  readonly myInvestorFunds = signal<MyInvestorFund[]>(MYINVESTOR_FUNDS as MyInvestorFund[]);
  readonly fundBalances = signal<FundBalance[]>(FUND_BALANCES as FundBalance[]);
  readonly expenses = signal<Expense[]>(EXPENSES as Expense[]);
  readonly incomes = signal<IncomeSource[]>(INCOMES as IncomeSource[]);
  readonly salaryAllocations = signal<SalaryAllocation[]>(SALARY_ALLOCATIONS as SalaryAllocation[]);
  readonly commitments = signal<Commitment[]>(COMMITMENTS as Commitment[]);
  readonly alerts = signal<Alert[]>(ALERTS as Alert[]);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);

  ngOnInit(): void {
    this.http.get<Platform[]>(`${API_URL}/plataformas`)
      .subscribe(data => this.platforms.set(data));

    this.http.get<Account[]>(`${API_URL}/cuentas`)
      .subscribe(data => this.accounts.set(data));
  }

  getAccountsByPlatform(platformId: string): Account[] {
    return this.accounts().filter(a => a.platformId === platformId);
  }

  getPlatform(id: string): Platform | undefined {
    return this.platforms().find(p => p.id === id);
  }

  getAccount(id: string): Account | undefined {
    return this.accounts().find(a => a.id === id);
  }

  private getAccountPlatformId(accountId: string): string {
    return this.accounts().find(a => a.id === accountId)?.platformId ?? '';
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

  readonly monthlySummary = computed(() =>
    this.getMonthlySummary(this.currentYear(), this.currentMonth())
  );

  getMonthlySummary(year: number, month: number): MonthlySummary {
    const snapshots = this.getSnapshotsByMonth(year, month);
    const totalBalance = snapshots.reduce((sum, s) => sum + s.balance, 0);
    const totalIncome = snapshots.reduce((sum, s) => sum + s.income, 0);
    const totalExpenses = snapshots.reduce((sum, s) => sum + s.expenses, 0);
    const balanceWithoutExpenses = snapshots
      .filter(s => this.getAccountPlatformId(s.accountId) !== EXPENSES_PLATFORM_ID)
      .reduce((sum, s) => sum + s.balance, 0);

    return {
      year,
      month,
      totalBalance,
      totalIncome,
      totalExpenses,
      balanceWithoutExpenses,
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

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number): void {
    const existing = this.getSnapshot(accountId, year, month);
    if (existing) {
      const data: Partial<MonthlySnapshot> = { balance };
      if (incomeDelta !== 0) { data.income = existing.income + incomeDelta; }
      if (expenses !== undefined) { data.expenses = expenses; }
      this.updateSnapshot(existing.id, data);
    } else {
      this.addSnapshot({
        id: `${accountId}-${year}-${String(month).padStart(2, '0')}`,
        accountId,
        year,
        month,
        balance,
        income: Math.max(0, incomeDelta),
        expenses: expenses ?? 0,
      });
    }
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

  getSalaryAllocationsByMonth(year: number, month: number): SalaryAllocation[] {
    return this.salaryAllocations().filter(a => a.year === year && a.month === month);
  }

  addSalaryAllocation(allocation: SalaryAllocation): void {
    this.salaryAllocations.update(arr => [...arr, allocation]);
  }

  updateSalaryAllocation(id: string, data: Partial<SalaryAllocation>): void {
    this.salaryAllocations.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteSalaryAllocation(id: string): void {
    this.salaryAllocations.update(arr => arr.filter(a => a.id !== id));
  }

  getCommitmentsByMonth(month: number): Commitment[] {
    return this.commitments().filter(c => {
      if (c.type === 'monthly') { return true; }
      if (c.type === 'annual') { return c.month === month; }
      return c.month === month && (!c.year || c.year === this.currentYear());
    });
  }

  getAllCommitments(): Commitment[] {
    return this.commitments();
  }

  addCommitment(commitment: Commitment): void {
    this.commitments.update(arr => [...arr, commitment]);
  }

  updateCommitment(id: string, data: Partial<Commitment>): void {
    this.commitments.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteCommitment(id: string): void {
    this.commitments.update(arr => arr.filter(a => a.id !== id));
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

  addMyInvestorFund(fund: MyInvestorFund): void {
    this.myInvestorFunds.update(arr => [...arr, fund]);
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): void {
    this.myInvestorFunds.update(arr => arr.map(f => f.id === id ? { ...f, ...data } : f));
  }

  deleteMyInvestorFund(id: string): void {
    this.myInvestorFunds.update(arr => arr.filter(f => f.id !== id));
  }

  getFundBalancesByMonth(year: number, month: number): FundBalance[] {
    return this.fundBalances().filter(b => b.year === year && b.month === month);
  }

  getFundBalance(fundId: string, year: number, month: number): FundBalance | undefined {
    return this.fundBalances().find(b => b.fundId === fundId && b.year === year && b.month === month);
  }

  getTotalFundBalanceForMonth(year: number, month: number): number {
    return this.getFundBalancesByMonth(year, month).reduce((sum, b) => sum + b.balance, 0);
  }

  addFundBalance(balance: FundBalance): void {
    this.fundBalances.update(arr => [...arr, balance]);
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): void {
    this.fundBalances.update(arr => arr.map(b => b.id === id ? { ...b, ...data } : b));
  }

  deleteFundBalance(id: string): void {
    this.fundBalances.update(arr => arr.filter(b => b.id !== id));
  }

  getAlertsByMonth(year: number, month: number): Alert[] {
    return this.alerts().filter(a => a.year === year && a.month === month);
  }

  getAllAlerts(): Alert[] {
    return this.alerts();
  }

  addAlert(alert: Alert): void {
    this.alerts.update(arr => [...arr, alert]);
  }

  updateAlert(id: string, data: Partial<Alert>): void {
    this.alerts.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteAlert(id: string): void {
    this.alerts.update(arr => arr.filter(a => a.id !== id));
  }
}
