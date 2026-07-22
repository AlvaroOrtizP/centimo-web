import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { SnapshotsService } from '../../api/generated/api/snapshots.service';
import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';

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

// const API_URL = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly snapshotsService = inject(SnapshotsService);

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

  fetchSnapshotFromBackend(accountId: string, year: number, month: number): Observable<SnapshotResponse | null> {
    console.log('[FinancialData] fetchSnapshotFromBackend called', { accountId, year, month });
    return this.snapshotsService.getSnapshotByAccountAndDate(accountId, year, month).pipe(
      map(response => {
        console.log('[FinancialData] fetchSnapshotFromBackend response', response);
        return response as SnapshotResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('[FinancialData] fetchSnapshotFromBackend error', error.status);
        return error.status === 404 ? of(null) : of(null);
      }),
    );
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
    // TODO: this.http.post<MonthlySnapshot>(`${API_URL}/instantaneas`, { ... }).subscribe(created => this.snapshots.update(arr => [...arr, created]));
    this.snapshots.update(arr => [...arr, snapshot]);
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    // TODO: this.http.put<MonthlySnapshot>(`${API_URL}/instantaneas/${id}`, { ... }).subscribe(updated => ...);
    this.snapshots.update(arr => arr.map(s => s.id === id ? { ...s, ...data } : s));
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number): void {
    // TODO: this.http.post<MonthlySnapshot>(`${API_URL}/instantaneas/upsert`, { ... }).subscribe(result => ...);
    const existing = this.getSnapshot(accountId, year, month);
    if (existing) {
      this.snapshots.update(arr => arr.map(s =>
        s.id === existing.id ? { ...s, balance, income: s.income + incomeDelta, ...(expenses !== undefined ? { expenses } : {}) } : s
      ));
    } else {
      const newSnapshot: MonthlySnapshot = {
        id: crypto.randomUUID(),
        accountId,
        year,
        month,
        balance,
        income: incomeDelta,
        expenses: expenses ?? 0,
        contribution: 0,
        notes: '',
      };
      this.snapshots.update(arr => [...arr, newSnapshot]);
    }
  }

  toggleChecklistItem(snapshotId: string, itemId: string): void {
    // TODO: this.http.post<any>(`${API_URL}/instantaneas/${snapshotId}/tareas/${itemId}/alternar`, {}).subscribe(updated => ...);
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
    // TODO: this.http.post<InvestmentHolding>(`${API_URL}/posiciones`, { ... }).subscribe(created => this.holdings.update(arr => [...arr, created]));
    this.holdings.update(arr => [...arr, holding]);
  }

  addExpense(expense: Expense): void {
    // TODO: this.http.post<Expense>(`${API_URL}/gastos`, { ... }).subscribe(created => this.expenses.update(arr => [...arr, created]));
    this.expenses.update(arr => [...arr, expense]);
  }

  deleteExpense(id: string): void {
    // TODO: this.http.delete(`${API_URL}/gastos/${id}`).subscribe(() => ...);
    this.expenses.update(arr => arr.filter(e => e.id !== id));
  }

  addIncome(income: IncomeSource): void {
    // TODO: this.http.post<IncomeSource>(`${API_URL}/ingresos`, { ... }).subscribe(created => this.incomes.update(arr => [...arr, created]));
    this.incomes.update(arr => [...arr, income]);
  }

  deleteIncome(id: string): void {
    // TODO: this.http.delete(`${API_URL}/ingresos/${id}`).subscribe(() => ...);
    this.incomes.update(arr => arr.filter(i => i.id !== id));
  }

  getSalaryAllocationsByMonth(year: number, month: number): SalaryAllocation[] {
    return this.salaryAllocations().filter(a => a.year === year && a.month === month);
  }

  addSalaryAllocation(allocation: SalaryAllocation): void {
    // TODO: this.http.post<SalaryAllocation>(`${API_URL}/asignaciones-salario`, { ... }).subscribe(created => this.salaryAllocations.update(arr => [...arr, created]));
    this.salaryAllocations.update(arr => [...arr, allocation]);
  }

  updateSalaryAllocation(id: string, data: Partial<SalaryAllocation>): void {
    // TODO: this.http.put<SalaryAllocation>(`${API_URL}/asignaciones-salario/${id}`, { ... }).subscribe(updated => ...);
    this.salaryAllocations.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteSalaryAllocation(id: string): void {
    // TODO: this.http.delete(`${API_URL}/asignaciones-salario/${id}`).subscribe(() => ...);
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
    // TODO: this.http.post<Commitment>(`${API_URL}/compromisos`, { ... }).subscribe(created => this.commitments.update(arr => [...arr, created]));
    this.commitments.update(arr => [...arr, commitment]);
  }

  updateCommitment(id: string, data: Partial<Commitment>): void {
    // TODO: this.http.put<Commitment>(`${API_URL}/compromisos/${id}`, { ... }).subscribe(updated => ...);
    this.commitments.update(arr => arr.map(a => a.id === id ? { ...a, ...data } : a));
  }

  deleteCommitment(id: string): void {
    // TODO: this.http.delete(`${API_URL}/compromisos/${id}`).subscribe(() => ...);
    this.commitments.update(arr => arr.filter(a => a.id !== id));
  }

  addTrade(trade: InvestmentTransaction): void {
    // TODO: this.http.post<InvestmentTransaction>(`${API_URL}/operaciones`, { ... }).subscribe(created => this.trades.update(arr => [...arr, created]));
    this.trades.update(arr => [...arr, trade]);
  }

  deleteTrade(id: string): void {
    // TODO: this.http.delete(`${API_URL}/operaciones/${id}`).subscribe(() => ...);
    this.trades.update(arr => arr.filter(t => t.id !== id));
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): void {
    // TODO: this.http.post<CrowdlendingInvestment>(`${API_URL}/crowdlending`, { ... }).subscribe(created => this.crowdlending.update(arr => [...arr, created]));
    this.crowdlending.update(arr => [...arr, investment]);
  }

  deleteCrowdlendingInvestment(id: string): void {
    // TODO: this.http.delete(`${API_URL}/crowdlending/${id}`).subscribe(() => ...);
    this.crowdlending.update(arr => arr.filter(c => c.id !== id));
  }

  deleteSnapshot(id: string): void {
    // TODO: this.http.delete(`${API_URL}/instantaneas/${id}`).subscribe(() => ...);
    this.snapshots.update(arr => arr.filter(s => s.id !== id));
  }

  deleteHolding(id: string): void {
    // TODO: this.http.delete(`${API_URL}/posiciones/${id}`).subscribe(() => ...);
    this.holdings.update(arr => arr.filter(h => h.id !== id));
  }

  addMyInvestorFund(fund: MyInvestorFund): void {
    // TODO: this.http.post<MyInvestorFund>(`${API_URL}/fondos-myinvestor`, { ... }).subscribe(created => this.myInvestorFunds.update(arr => [...arr, created]));
    this.myInvestorFunds.update(arr => [...arr, fund]);
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): void {
    // TODO: this.http.put<MyInvestorFund>(`${API_URL}/fondos-myinvestor/${id}`, { ... }).subscribe(updated => ...);
    this.myInvestorFunds.update(arr => arr.map(f => f.id === id ? { ...f, ...data } : f));
  }

  deleteMyInvestorFund(id: string): void {
    // TODO: this.http.delete(`${API_URL}/fondos-myinvestor/${id}`).subscribe(() => ...);
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
    // TODO: this.http.post<FundBalance>(`${API_URL}/balances-fondo`, { ... }).subscribe(created => this.fundBalances.update(arr => [...arr, created]));
    this.fundBalances.update(arr => [...arr, balance]);
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): void {
    // TODO: this.http.put<FundBalance>(`${API_URL}/balances-fondo/${id}`, { ... }).subscribe(updated => ...);
    this.fundBalances.update(arr => arr.map(b => b.id === id ? { ...b, ...data } : b));
  }

  deleteFundBalance(id: string): void {
    // TODO: this.http.delete(`${API_URL}/balances-fondo/${id}`).subscribe(() => ...);
    this.fundBalances.update(arr => arr.filter(b => b.id !== id));
  }

}
