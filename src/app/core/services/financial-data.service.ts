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

const API_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class FinancialDataService implements OnInit {
  private readonly http = inject(HttpClient);

  readonly platforms = signal<Platform[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly snapshots = signal<MonthlySnapshot[]>([]);
  readonly holdings = signal<InvestmentHolding[]>([]);
  readonly trades = signal<InvestmentTransaction[]>([]);
  readonly crowdlending = signal<CrowdlendingInvestment[]>([]);
  readonly myInvestorFunds = signal<MyInvestorFund[]>([]);
  readonly fundBalances = signal<FundBalance[]>([]);
  readonly expenses = signal<Expense[]>([]);
  readonly incomes = signal<IncomeSource[]>([]);
  readonly salaryAllocations = signal<SalaryAllocation[]>([]);
  readonly commitments = signal<Commitment[]>([]);

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);

  ngOnInit(): void {
    this.http.get<Platform[]>(`${API_URL}/plataformas`)
      .subscribe(data => this.platforms.set(data));

    this.http.get<Account[]>(`${API_URL}/cuentas`)
      .subscribe(accounts => {
        this.accounts.set(accounts);
        for (const account of accounts) {
          this.http.get<InvestmentTransaction[]>(`${API_URL}/operaciones`, { params: { cuentaId: account.id } })
            .subscribe(trades => this.trades.update(arr => [...arr, ...trades]));
        }
      });

    this.http.get<MonthlySnapshot[]>(`${API_URL}/instantaneas`)
      .subscribe(data => {
        this.snapshots.set(data);
        for (const snapshot of data) {
          this.http.get<Expense[]>(`${API_URL}/gastos`, { params: { instantaneaId: snapshot.id } })
            .subscribe(expenses => this.expenses.update(arr => [...arr, ...expenses]));
          this.http.get<IncomeSource[]>(`${API_URL}/ingresos`, { params: { instantaneaId: snapshot.id } })
            .subscribe(incomes => this.incomes.update(arr => [...arr, ...incomes]));
          this.http.get<InvestmentHolding[]>(`${API_URL}/posiciones`, { params: { instantaneaId: snapshot.id } })
            .subscribe(holdings => this.holdings.update(arr => [...arr, ...holdings]));
        }
      });
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
    this.http.post<MonthlySnapshot>(`${API_URL}/instantaneas`, {
      id: snapshot.id,
      accountId: snapshot.accountId,
      year: snapshot.year,
      month: snapshot.month,
      balance: snapshot.balance,
      income: snapshot.income,
      expenses: snapshot.expenses,
      contribution: snapshot.contribution,
      notes: snapshot.notes,
    }).subscribe(created => this.snapshots.update(arr => [...arr, created]));
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    this.http.put<MonthlySnapshot>(`${API_URL}/instantaneas/${id}`, {
      balance: data.balance,
      income: data.income,
      expenses: data.expenses,
      contribution: data.contribution,
      notes: data.notes,
    }).subscribe(updated => this.snapshots.update(arr => arr.map(s => s.id === id ? updated : s)));
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number): void {
    this.http.post<MonthlySnapshot>(`${API_URL}/instantaneas/upsert`, {
      accountId,
      year,
      month,
      balance,
      deltaIncome: incomeDelta,
      expenses,
    }).subscribe(result => {
      const existing = this.getSnapshot(accountId, year, month);
      if (existing) {
        this.snapshots.update(arr => arr.map(s => s.id === result.id ? result : s));
      } else {
        this.snapshots.update(arr => [...arr, result]);
      }
    });
  }

  toggleChecklistItem(snapshotId: string, itemId: string): void {
    this.http.post<any>(`${API_URL}/instantaneas/${snapshotId}/tareas/${itemId}/alternar`, {})
      .subscribe(updated => {
        this.snapshots.update(arr => arr.map(s => {
          if (s.id !== snapshotId || !s.checklistItems) { return s; }
          return {
            ...s,
            checklistItems: s.checklistItems.map(item =>
              item.id === itemId ? { ...item, checked: updated.marcado } : item
            ),
          };
        }));
      });
  }

  addHolding(holding: InvestmentHolding): void {
    this.http.post<InvestmentHolding>(`${API_URL}/posiciones`, {
      id: holding.id,
      snapshotId: holding.snapshotId,
      assetName: holding.assetName,
      assetType: holding.assetType,
      quantity: holding.quantity,
      valuePerUnit: holding.valuePerUnit,
      totalValue: holding.totalValue,
    }).subscribe(created => this.holdings.update(arr => [...arr, created]));
  }

  addExpense(expense: Expense): void {
    this.http.post<Expense>(`${API_URL}/gastos`, {
      id: expense.id,
      snapshotId: expense.snapshotId,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
    }).subscribe(created => this.expenses.update(arr => [...arr, created]));
  }

  deleteExpense(id: string): void {
    this.http.delete(`${API_URL}/gastos/${id}`)
      .subscribe(() => this.expenses.update(arr => arr.filter(e => e.id !== id)));
  }

  addIncome(income: IncomeSource): void {
    this.http.post<IncomeSource>(`${API_URL}/ingresos`, {
      id: income.id,
      snapshotId: income.snapshotId,
      source: income.source,
      description: income.description,
      amount: income.amount,
    }).subscribe(created => this.incomes.update(arr => [...arr, created]));
  }

  deleteIncome(id: string): void {
    this.http.delete(`${API_URL}/ingresos/${id}`)
      .subscribe(() => this.incomes.update(arr => arr.filter(i => i.id !== id)));
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
    this.http.post<InvestmentTransaction>(`${API_URL}/operaciones`, {
      id: trade.id,
      accountId: trade.accountId,
      assetName: trade.assetName,
      assetType: trade.assetType,
      type: trade.type,
      buyDate: trade.buyDate,
      buyQuantity: trade.buyQuantity,
      buyPricePerUnit: trade.buyPricePerUnit,
      buyTotalCost: trade.buyTotalCost,
      sellDate: trade.sellDate,
      sellPricePerUnit: trade.sellPricePerUnit,
      sellTotalReceived: trade.sellTotalReceived,
      sellQuantity: trade.sellQuantity,
      pnl: trade.pnl,
      status: trade.status,
    }).subscribe(created => this.trades.update(arr => [...arr, created]));
  }

  deleteTrade(id: string): void {
    this.http.delete(`${API_URL}/operaciones/${id}`)
      .subscribe(() => this.trades.update(arr => arr.filter(t => t.id !== id)));
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): void {
    this.crowdlending.update(arr => [...arr, investment]);
  }

  deleteCrowdlendingInvestment(id: string): void {
    this.crowdlending.update(arr => arr.filter(c => c.id !== id));
  }

  deleteSnapshot(id: string): void {
    this.http.delete(`${API_URL}/instantaneas/${id}`)
      .subscribe(() => this.snapshots.update(arr => arr.filter(s => s.id !== id)));
  }

  deleteHolding(id: string): void {
    this.http.delete(`${API_URL}/posiciones/${id}`)
      .subscribe(() => this.holdings.update(arr => arr.filter(h => h.id !== id)));
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

}
