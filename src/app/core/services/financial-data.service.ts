import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';

import { PlatformsDataService } from './platforms.service';
import { SnapshotsDataService } from './snapshots.service';
import { ExpensesDataService } from './expenses.service';
import { IncomesDataService } from './incomes.service';
import { SalaryDataService } from './salary.service';
import { InvestmentsDataService } from './investments.service';
import { SummaryDataService } from './summary.service';

import { Platform } from '../../models/platform';
import { Account } from '../../models/account';
import { MonthlySnapshot } from '../../models/monthly-snapshot';
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
import { EXPENSES_PLATFORM_ID } from '../constants/platform.constants';

import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';
import { NominaCreate } from '../../api/generated/model/nominaCreate';
import { NominaResponse } from '../../api/generated/model/nominaResponse';
import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly platformsData = inject(PlatformsDataService);
  private readonly snapshotsData = inject(SnapshotsDataService);
  private readonly expensesData = inject(ExpensesDataService);
  private readonly incomesData = inject(IncomesDataService);
  private readonly salaryData = inject(SalaryDataService);
  private readonly investmentsData = inject(InvestmentsDataService);
  private readonly summaryData = inject(SummaryDataService);

  readonly platforms = computed(() => this.platformsData.platforms());
  readonly accounts = computed(() => this.platformsData.accounts());
  readonly snapshots = computed(() => this.snapshotsData.snapshots());
  readonly holdings = computed(() => this.investmentsData.holdings());
  readonly trades = computed(() => this.investmentsData.trades());
  readonly crowdlending = computed(() => this.investmentsData.crowdlending());
  readonly myInvestorFunds = computed(() => this.investmentsData.myInvestorFunds());
  readonly fundBalances = computed(() => this.investmentsData.fundBalances());
  readonly expenses = computed(() => this.expensesData.expenses());
  readonly incomes = computed(() => this.incomesData.incomes());
  readonly salaryAllocations = computed(() => this.salaryData.salaryAllocations());
  readonly commitments = computed(() => this.salaryData.commitments());

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);

  getAccountsByPlatform(platformId: string): Account[] {
    return this.platformsData.getAccountsByPlatform(platformId);
  }

  getPlatform(id: string): Platform | undefined {
    return this.platformsData.getPlatform(id);
  }

  getAccount(id: string): Account | undefined {
    return this.platformsData.getAccount(id);
  }

  getSnapshotsByAccount(accountId: string): MonthlySnapshot[] {
    return this.snapshotsData.getSnapshotsByAccount(accountId);
  }

  getSnapshotsByMonth(year: number, month: number): MonthlySnapshot[] {
    return this.snapshotsData.getSnapshotsByMonth(year, month);
  }

  getSnapshot(accountId: string, year: number, month: number): MonthlySnapshot | undefined {
    return this.snapshotsData.getSnapshot(accountId, year, month);
  }

  fetchSnapshotFromBackend(accountId: string, year: number, month: number): Observable<SnapshotResponse | null> {
    return this.snapshotsData.fetchSnapshotFromBackend(accountId, year, month);
  }

  loadAllSnapshots(): void {
    this.snapshotsData.loadAllSnapshots();
  }

  loadAllPlatforms(): void {
    this.platformsData.loadAllPlatforms();
  }

  loadAllAccounts(): void {
    this.platformsData.loadAllAccounts();
  }

  loadMonthlySummary(year: number, month: number): void {
    this.summaryData.loadMonthlySummary(year, month);
  }

  fetchNominaFromBackend(year: number, month: number): Observable<NominaResponse | null> {
    return this.incomesData.fetchNominaFromBackend(year, month);
  }

  createNomina(nomina: NominaCreate): Observable<NominaResponse | null> {
    return this.incomesData.createNomina(nomina);
  }

  getHoldingsBySnapshot(snapshotId: string): InvestmentHolding[] {
    return this.investmentsData.getHoldingsBySnapshot(snapshotId);
  }

  getTradesByAccount(accountId: string): InvestmentTransaction[] {
    return this.investmentsData.getTradesByAccount(accountId);
  }

  getCrowdlendingByPlatform(platformId: string): CrowdlendingInvestment[] {
    return this.investmentsData.getCrowdlendingByPlatform(platformId);
  }

  loadExpenses(snapshotId: string): void {
    this.expensesData.loadExpenses(snapshotId);
  }

  getExpensesBySnapshot(snapshotId: string): Expense[] {
    return this.expensesData.getExpensesBySnapshot(snapshotId);
  }

  getIncomesBySnapshot(snapshotId: string): IncomeSource[] {
    return this.incomesData.getIncomesBySnapshot(snapshotId);
  }

  readonly monthlySummary = computed(() =>
    this.getMonthlySummary(this.currentYear(), this.currentMonth())
  );

  getMonthlySummary(year: number, month: number): MonthlySummary {
    const cached = this.summaryData.getMonthlySummary(year, month);
    if (cached.totalBalance !== 0 || cached.totalIncome !== 0 || cached.totalExpenses !== 0) {
      return cached;
    }

    const snapshots = this.getSnapshotsByMonth(year, month);
    const totalBalance = snapshots.reduce((sum, s) => sum + s.balance, 0);
    const totalIncome = snapshots.reduce((sum, s) => sum + s.income, 0);
    const totalExpenses = snapshots.reduce((sum, s) => sum + s.expenses, 0);
    const balanceWithoutExpenses = snapshots
      .filter(s => this.platformsData.getAccountPlatformId(s.accountId) !== EXPENSES_PLATFORM_ID)
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
    return this.snapshotsData.snapshots().filter(s => accountIds.has(s.accountId));
  }

  getAvailableMonths(): { year: number; month: number }[] {
    return this.snapshotsData.getAvailableMonths();
  }

  addSnapshot(snapshot: MonthlySnapshot): void {
    this.snapshotsData.addSnapshot(snapshot);
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    this.snapshotsData.updateSnapshot(id, data);
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number, contribution?: number): Observable<SnapshotResponse> {
    return this.snapshotsData.upsertSnapshot(accountId, year, month, balance, incomeDelta, expenses, contribution);
  }

  toggleChecklistItem(snapshotId: string, itemId: string): void {
    this.snapshotsData.toggleChecklistItem(snapshotId, itemId);
  }

  addHolding(holding: InvestmentHolding): void {
    this.investmentsData.addHolding(holding);
  }

  addExpense(expense: Expense): Observable<Expense> {
    return this.expensesData.addExpense(expense);
  }

  updateExpense(id: string, data: ExpenseUpdate): Observable<Expense> {
    return this.expensesData.updateExpense(id, data);
  }

  deleteExpense(id: string, snapshotId: string): void {
    this.expensesData.deleteExpense(id, snapshotId);
  }

  addIncome(income: IncomeSource): void {
    this.incomesData.addIncome(income);
  }

  deleteIncome(id: string): void {
    this.incomesData.deleteIncome(id);
  }

  getSalaryAllocationsByMonth(year: number, month: number): SalaryAllocation[] {
    return this.salaryData.getSalaryAllocationsByMonth(year, month);
  }

  addSalaryAllocation(allocation: SalaryAllocation): void {
    this.salaryData.addSalaryAllocation(allocation);
  }

  updateSalaryAllocation(id: string, data: Partial<SalaryAllocation>): void {
    this.salaryData.updateSalaryAllocation(id, data);
  }

  deleteSalaryAllocation(id: string): void {
    this.salaryData.deleteSalaryAllocation(id);
  }

  getCommitmentsByMonth(month: number): Commitment[] {
    return this.salaryData.commitments().filter(c => {
      if (c.type === 'monthly') { return true; }
      if (c.type === 'annual') { return c.month === month; }
      return c.month === month && (!c.year || c.year === this.currentYear());
    });
  }

  getAllCommitments(): Commitment[] {
    return this.salaryData.getAllCommitments();
  }

  addCommitment(commitment: Commitment): void {
    this.salaryData.addCommitment(commitment);
  }

  updateCommitment(id: string, data: Partial<Commitment>): void {
    this.salaryData.updateCommitment(id, data);
  }

  deleteCommitment(id: string): void {
    this.salaryData.deleteCommitment(id);
  }

  addTrade(trade: InvestmentTransaction): void {
    this.investmentsData.addTrade(trade);
  }

  deleteTrade(id: string): void {
    this.investmentsData.deleteTrade(id);
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): void {
    this.investmentsData.addCrowdlendingInvestment(investment);
  }

  deleteCrowdlendingInvestment(id: string): void {
    this.investmentsData.deleteCrowdlendingInvestment(id);
  }

  deleteSnapshot(id: string): void {
    this.snapshotsData.deleteSnapshot(id);
  }

  deleteHolding(id: string): void {
    this.investmentsData.deleteHolding(id);
  }

  addMyInvestorFund(fund: MyInvestorFund): void {
    this.investmentsData.addMyInvestorFund(fund);
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): void {
    this.investmentsData.updateMyInvestorFund(id, data);
  }

  deleteMyInvestorFund(id: string): void {
    this.investmentsData.deleteMyInvestorFund(id);
  }

  getFundBalancesByMonth(year: number, month: number): FundBalance[] {
    return this.investmentsData.getFundBalancesByMonth(year, month);
  }

  getFundBalance(fundId: string, year: number, month: number): FundBalance | undefined {
    return this.investmentsData.getFundBalance(fundId, year, month);
  }

  getTotalFundBalanceForMonth(year: number, month: number): number {
    return this.investmentsData.getFundBalancesByMonth(year, month).reduce((sum, b) => sum + b.balance, 0);
  }

  addFundBalance(balance: FundBalance): void {
    this.investmentsData.addFundBalance(balance);
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): void {
    this.investmentsData.updateFundBalance(id, data);
  }

  deleteFundBalance(id: string): void {
    this.investmentsData.deleteFundBalance(id);
  }
}
