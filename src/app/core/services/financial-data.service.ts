import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { SnapshotsService } from '../../api/generated/api/snapshots.service';
import { PlatformsService } from '../../api/generated/api/platforms.service';
import { AccountsService } from '../../api/generated/api/accounts.service';
import { SummariesService } from '../../api/generated/api/summaries.service';
import { IncomesService } from '../../api/generated/api/incomes.service';
import { ExpensesService } from '../../api/generated/api/expenses.service';
import { NominaService } from '../../api/generated/api/nomina.service';
import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';
import { SnapshotUpsert } from '../../api/generated/model/snapshotUpsert';
import { NominaCreate } from '../../api/generated/model/nominaCreate';
import { NominaResponse } from '../../api/generated/model/nominaResponse';
import { MonthlySnapshotCreate } from '../../api/generated/model/monthlySnapshotCreate';
import { IncomeSourceCreate } from '../../api/generated/model/incomeSourceCreate';
import { ExpenseCreate } from '../../api/generated/model/expenseCreate';
import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';

import { Platform } from '../../models/platform';
import { PlatformType } from '../../models/platform-type';
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
  private readonly platformsService = inject(PlatformsService);
  private readonly accountsService = inject(AccountsService);
  private readonly summariesService = inject(SummariesService);
  private readonly incomesService = inject(IncomesService);
  private readonly expensesService = inject(ExpensesService);
  private readonly nominaService = inject(NominaService);

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

  private readonly summariesCache = signal<Map<string, MonthlySummary>>(new Map());

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

  loadAllSnapshots(): void {
    this.snapshotsService.listSnapshots().pipe(
      map(list => list.map(s => ({
        id: s.id,
        accountId: s.accountId,
        year: s.year,
        month: s.month,
        balance: s.balance,
        income: s.income,
        expenses: s.expenses,
        contribution: s.contribution ?? undefined,
        notes: s.notes ?? undefined,
        checklistItems: s.checklistItems ?? undefined,
      }))),
      catchError((err) => {
        console.error('[FinancialData] loadAllSnapshots error', err);
        return of([]);
      }),
    ).subscribe(snapshots => {
      console.log('[FinancialData] loadAllSnapshots loaded', snapshots.length, 'snapshots');
      this.snapshots.set(snapshots);
    });
  }

  loadAllPlatforms(): void {
    this.platformsService.listPlatforms().pipe(
      map(list => list.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type as unknown as PlatformType,
        color: p.color,
        icon: p.icon,
        order: p.order,
        fixedNotes: p.fixedNotes ?? undefined,
      }))),
      catchError((err) => {
        console.error('[FinancialData] loadAllPlatforms error', err);
        return of([]);
      }),
    ).subscribe(platforms => {
      console.log('[FinancialData] loadAllPlatforms loaded', platforms.length, 'platforms');
      this.platforms.set(platforms);
    });
  }

  loadAllAccounts(): void {
    this.accountsService.listAccounts().pipe(
      map(list => list.map(a => ({
        id: a.id,
        platformId: a.platformId,
        name: a.name,
        type: a.type,
        currency: a.currency,
        order: a.order,
      }))),
      catchError((err) => {
        console.error('[FinancialData] loadAllAccounts error', err);
        return of([]);
      }),
    ).subscribe(accounts => {
      console.log('[FinancialData] loadAllAccounts loaded', accounts.length, 'accounts');
      this.accounts.set(accounts);
    });
  }

  loadMonthlySummary(year: number, month: number): void {
    const key = `${year}-${month}`;
    if (this.summariesCache().has(key)) { return; }

    this.summariesService.getMonthlySummary(year, month).pipe(
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
        console.error('[FinancialData] loadMonthlySummary error', { year, month }, err);
        return of(null);
      }),
    ).subscribe(summary => {
      if (!summary) { return; }
      console.log('[FinancialData] loadMonthlySummary loaded', key);
      this.summariesCache.update(cache => {
        const next = new Map(cache);
        next.set(key, summary);
        return next;
      });
    });
  }

  fetchNominaFromBackend(year: number, month: number): Observable<NominaResponse | null> {
    console.log('[FinancialData] fetchNominaFromBackend called', { year, month });
    return this.nominaService.getNominaAndDate(year, month).pipe(
      map(response => {
        console.log('[FinancialData] fetchNominaFromBackend response', response);
        return response as NominaResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('[FinancialData] fetchNominaFromBackend error', error.status);
        return error.status === 404 ? of(null) : of(null);
      }),
    );
  }

  createNomina(nomina: NominaCreate): Observable<NominaResponse | null> {
    console.log('[FinancialData] createNomina called', nomina);
    return this.nominaService.createNomina(nomina).pipe(
      map(response => {
        console.log('[FinancialData] createNomina response', response);
        return response as NominaResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('[FinancialData] createNomina error', error.status);
        return of(null);
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

  loadExpenses(snapshotId: string): void {
    this.expensesService.listExpenses(snapshotId).pipe(
      map(list => list.map(e => ({
        id: e.id,
        snapshotId: e.snapshotId,
        category: e.category,
        amount: e.amount,
        date: e.date,
        description: e.description ?? undefined,
      }))),
      catchError((err) => {
        console.error('[FinancialData] loadExpenses error', err);
        return of([]);
      }),
    ).subscribe(expenses => {
      this.expenses.update(arr => {
        const others = arr.filter(e => e.snapshotId !== snapshotId);
        return [...others, ...expenses];
      });
    });
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
    const key = `${year}-${month}`;
    const cached = this.summariesCache().get(key);
    if (cached) { return cached; }

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
    const create: MonthlySnapshotCreate = {
      accountId: snapshot.accountId,
      year: snapshot.year,
      month: snapshot.month,
      balance: snapshot.balance,
      income: snapshot.income,
      expenses: snapshot.expenses,
      contribution: snapshot.contribution ?? null,
      notes: snapshot.notes ?? null,
    };
    this.snapshotsService.createSnapshot(create).subscribe(created => {
      this.snapshots.update(arr => [...arr, {
        id: created.id,
        accountId: created.accountId,
        year: created.year,
        month: created.month,
        balance: created.balance,
        income: created.income,
        expenses: created.expenses,
        contribution: created.contribution ?? undefined,
        notes: created.notes ?? undefined,
        checklistItems: created.checklistItems ?? undefined,
      }]);
    });
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    // TODO: this.http.put<MonthlySnapshot>(`${API_URL}/instantaneas/${id}`, { ... }).subscribe(updated => ...);
    this.snapshots.update(arr => arr.map(s => s.id === id ? { ...s, ...data } : s));
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number): Observable<SnapshotResponse> {
    const body: SnapshotUpsert = {
      accountId,
      year,
      month,
      balance,
      incomeDelta,
      expenses,
    };
    return this.snapshotsService.upsertSnapshot(body).pipe(
      map(result => {
        const snapshot: MonthlySnapshot = {
          id: result.id,
          accountId: result.accountId,
          year: result.year,
          month: result.month,
          balance: result.balance,
          income: result.income,
          expenses: result.expenses,
          contribution: result.contribution ?? undefined,
          notes: result.notes ?? undefined,
          checklistItems: result.checklistItems ?? undefined,
        };
        const existing = this.getSnapshot(accountId, year, month);
        if (existing) {
          this.snapshots.update(arr => arr.map(s =>
            s.id === existing.id ? snapshot : s
          ));
        } else {
          this.snapshots.update(arr => [...arr, snapshot]);
        }
        return result;
      }),
    );
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

  addExpense(expense: Expense): Observable<Expense> {
    const create: ExpenseCreate = {
      snapshotId: expense.snapshotId,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description ?? null,
    };
    return this.expensesService.createExpense(create).pipe(
      map(created => {
        const result: Expense = {
          id: created.id,
          snapshotId: created.snapshotId,
          category: created.category,
          amount: created.amount,
          date: created.date,
          description: created.description ?? undefined,
        };
        this.expenses.update(arr => [...arr, result]);
        return result;
      }),
    );
  }

  updateExpense(id: string, snapshotId: string, data: ExpenseUpdate): Observable<Expense> {
    return this.expensesService.updateExpense(id, snapshotId, data).pipe(
      map(updated => {
        const expense: Expense = {
          id: updated.id,
          snapshotId: updated.snapshotId,
          category: updated.category,
          amount: updated.amount,
          date: updated.date,
          description: updated.description ?? undefined,
        };
        this.expenses.update(arr => arr.map(e => e.id === id ? expense : e));
        return expense;
      }),
      catchError((err) => {
        console.error('[FinancialData] updateExpense error', err);
        return of(null as unknown as Expense);
      }),
    );
  }

  deleteExpense(id: string, snapshotId: string): void {
    this.expensesService.deleteExpense(id, snapshotId).subscribe(() => {
      this.expenses.update(arr => arr.filter(e => e.id !== id));
    });
  }

  addIncome(income: IncomeSource): void {
    const create: IncomeSourceCreate = {
      snapshotId: income.snapshotId,
      source: income.source,
      description: income.description,
      amount: income.amount,
    };
    this.incomesService.createIncome(create).subscribe(created => {
      this.incomes.update(arr => [...arr, {
        id: created.id,
        snapshotId: created.snapshotId,
        source: created.source,
        description: created.description,
        amount: created.amount,
      }]);
    });
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
