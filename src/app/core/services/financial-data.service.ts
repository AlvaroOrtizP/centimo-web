import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Observable } from 'rxjs';

import { PlatformsDataService } from './platforms.service';
import { SnapshotsDataService } from './snapshots.service';
import { ExpensesDataService } from './expenses.service';
import { IncomesDataService } from './incomes.service';
import { SalaryDataService } from './salary.service';
import { InvestmentsDataService } from './investments.service';
import { SummaryDataService } from './summary.service';
import { MintosInterestDataService } from './mintos-interest.service';
import { B100BalanceDataService } from './b100-balance.service';
import { RevolutBalanceDataService } from './revolut-balance.service';
import { MintosBalanceDataService } from './mintos-balance.service';
import { roundMoney } from '../utils/money.util';

import {
  Platform,
  Account,
  MonthlySnapshot,
  CrowdlendingInvestment,
  MintosAnnualInterest,
  MyInvestorFund,
  FundBalance,
  Expense,
  IncomeSource,
  MonthlySummary,
  SalaryAllocation,
  Commitment,
  PlatformMonthlyBalance,
  B100Balance,
  B100BalanceSave,
  B100Subcuenta,
  RevolutBalance,
  RevolutBalanceSave,
  MintosBalance,
  MintosBalanceSave,
} from '../../models';
import { EXPENSES_PLATFORM_ID } from '../constants/platform.constants';

// TODO(BACKEND): modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';
// import { NominaCreate } from '../../api/generated/model/nominaCreate';
// import { NominaResponse } from '../../api/generated/model/nominaResponse';
// import { ExpenseUpdate } from '../../api/generated/model/expenseUpdate';

@Injectable({ providedIn: 'root' })
export class FinancialDataService {
  private readonly platformsData = inject(PlatformsDataService);
  private readonly snapshotsData = inject(SnapshotsDataService);
  private readonly expensesData = inject(ExpensesDataService);
  private readonly incomesData = inject(IncomesDataService);
  private readonly salaryData = inject(SalaryDataService);
  private readonly investmentsData = inject(InvestmentsDataService);
  private readonly summaryData = inject(SummaryDataService);
  private readonly mintosInterestData = inject(MintosInterestDataService);
  private readonly b100Data = inject(B100BalanceDataService);
  private readonly revolutData = inject(RevolutBalanceDataService);
  private readonly mintosData = inject(MintosBalanceDataService);

  readonly platforms = computed(() => this.platformsData.platforms());
  readonly accounts = computed(() => this.platformsData.accounts());
  readonly snapshots = computed(() => this.snapshotsData.snapshots());
  readonly crowdlending = computed(() => this.investmentsData.crowdlending());
  readonly myInvestorFunds = computed(() => this.investmentsData.myInvestorFunds());
  readonly fundBalances = computed(() => this.investmentsData.fundBalances());
  readonly expenses = computed(() => this.expensesData.expenses());
  readonly incomes = computed(() => this.incomesData.incomes());
  readonly salaryAllocations = computed(() => this.salaryData.salaryAllocations());
  readonly commitments = computed(() => this.salaryData.commitments());

  readonly currentYear = signal(new Date().getFullYear());
  readonly currentMonth = signal(new Date().getMonth() + 1);

  readonly platformMonthlyBalances = this.summaryData.platformMonthlyBalances;
  readonly b100Balances = computed(() => this.b100Data.balances());
  readonly revolutBalances = computed(() => this.revolutData.balances());
  readonly mintosBalances = computed(() => this.mintosData.balances());

  private autoAdjustedToData = false;

  constructor() {
    effect(() => {
      const snapshots = this.snapshots();
      if (this.autoAdjustedToData || snapshots.length === 0) { return; }
      this.autoAdjustedToData = true;

      const year = this.currentYear();
      const month = this.currentMonth();
      const hasDataForCurrentMonth = snapshots.some(s =>
        s.year === year && s.month === month &&
        (s.balance !== 0 || s.income !== 0 || s.expenses !== 0)
      );
      if (hasDataForCurrentMonth) { return; }

      // Ajusta únicamente el mes al último con datos de ESTE año, sin salir del año actual.
      const latestMonthThisYear = snapshots
        .filter(s => s.year === year && (s.balance !== 0 || s.income !== 0 || s.expenses !== 0))
        .reduce((max, s) => (s.month > max ? s.month : max), 0);
      if (latestMonthThisYear > 0) {
        this.currentMonth.set(latestMonthThisYear);
      }
    }, { allowSignalWrites: true });
  }

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

  loadAllSnapshots(force = false): void {
    this.snapshotsData.loadAllSnapshots(force);
  }

  loadSnapshotsByYear(year: number, accountId?: string): void {
    this.snapshotsData.loadSnapshotsByYear(year, accountId);
  }

  loadAllPlatforms(force = false): void {
    this.platformsData.loadAllPlatforms(force);
  }

  /** Fuerza la recarga de todos los endpoints con cache (/platforms, /accounts y /snapshots). */
  refreshCachedData(): void {
    this.platformsData.loadAllPlatforms(true);
    this.platformsData.loadAllAccounts(true);
    this.snapshotsData.loadAllSnapshots(true);
  }

  loadAllAccounts(force = false): void {
    this.platformsData.loadAllAccounts(force);
  }

  loadMonthlySummary(year: number, month: number): void {
    this.summaryData.loadMonthlySummary(year, month);
  }

  loadMonthlySummariesRange(year: number, month: number, months: number, force = false): void {
    this.summaryData.loadMonthlySummariesRange(year, month, months, force);
  }

  loadPlatformMonthlyBalances(year: number, month: number, months: number, force = false): void {
    this.summaryData.loadPlatformMonthlyBalances(year, month, months, force);
  }

  fetchNominaFromBackend(year: number, month: number): Observable<any | null> {
    return this.incomesData.fetchNominaFromBackend(year, month);
  }

  createNomina(nomina: any): Observable<any | null> {
    return this.incomesData.createNomina(nomina);
  }

  getCrowdlendingByPlatform(platformId: string): CrowdlendingInvestment[] {
    return this.investmentsData.getCrowdlendingByPlatform(platformId);
  }

  loadExpenses(snapshotId: string): void {
    this.expensesData.loadExpenses(snapshotId);
  }

  loadExpensesByPeriod(year: number, month: number, force = false): void {
    this.expensesData.loadExpensesByMonth(year, month, force);
  }

  getExpensesBySnapshot(snapshotId: string): Expense[] {
    return this.expensesData.getExpensesBySnapshot(snapshotId);
  }

  getExpensesByPeriod(year: number, month: number): Expense[] {
    const snapshotIds = new Set(this.getSnapshotsByMonth(year, month).map(s => s.id));
    return this.expenses().filter(e => snapshotIds.has(e.snapshotId));
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
    const totalBalance = roundMoney(snapshots.reduce((sum, s) => sum + (s.balance ?? 0), 0)) ?? 0;
    const totalIncome = roundMoney(snapshots.reduce((sum, s) => sum + (s.income ?? 0), 0)) ?? 0;
    const totalExpenses = roundMoney(snapshots.reduce((sum, s) => sum + (s.expenses ?? 0), 0)) ?? 0;
    const balanceWithoutExpenses = roundMoney(snapshots
      .filter(s => this.platformsData.getAccountPlatformId(s.accountId) !== EXPENSES_PLATFORM_ID)
      .reduce((sum, s) => sum + (s.balance ?? 0), 0)) ?? 0;

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

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number, contribution?: number, tax?: number): Observable<MonthlySnapshot> {
    return this.snapshotsData.upsertSnapshot(accountId, year, month, balance, incomeDelta, expenses, contribution, tax);
  }

  toggleChecklistItem(snapshotId: string, itemId: string): void {
    this.snapshotsData.toggleChecklistItem(snapshotId, itemId);
  }

  addExpense(expense: Expense): Observable<Expense> {
    return this.expensesData.addExpense(expense);
  }

  updateExpense(id: string, data: any): Observable<Expense> {
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

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    return this.investmentsData.addCrowdlendingInvestment(investment);
  }

  updateCrowdlendingInvestment(id: string, investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    return this.investmentsData.updateCrowdlendingInvestment(id, investment);
  }

  deleteCrowdlendingInvestment(id: string): Observable<void> {
    return this.investmentsData.deleteCrowdlendingInvestment(id);
  }

  /** @deprecated El endpoint /crowdlending ya no se carga al iniciar la web. Solo se usa al entrar datos. */
  loadAllCrowdlending(): void {
    this.investmentsData.loadAllCrowdlending();
  }

  deleteSnapshot(id: string): void {
    this.snapshotsData.deleteSnapshot(id);
  }

  addMyInvestorFund(fund: MyInvestorFund): Observable<MyInvestorFund> {
    return this.investmentsData.addMyInvestorFund(fund);
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): void {
    this.investmentsData.updateMyInvestorFund(id, data);
  }

  deleteMyInvestorFund(id: string): Observable<void> {
    return this.investmentsData.deleteMyInvestorFund(id);
  }

  /** @deprecated El endpoint /myinvestor-funds ya no se carga al iniciar la web. Solo se usa al entrar datos. */
  loadAllMyInvestorFunds(): void {
    this.investmentsData.loadAllMyInvestorFunds();
  }

  loadFundBalances(year: number, month: number): void {
    this.investmentsData.loadFundBalances(year, month);
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

  addFundBalance(balance: FundBalance): Observable<FundBalance> {
    return this.investmentsData.addFundBalance(balance);
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): Observable<FundBalance> {
    return this.investmentsData.updateFundBalance(id, data);
  }

  deleteFundBalance(id: string): Observable<void> {
    return this.investmentsData.deleteFundBalance(id);
  }

  getMintosAnnualInterest(year: number): Observable<MintosAnnualInterest | null> {
    return this.mintosInterestData.getByYear(year);
  }

  saveMintosAnnualInterest(interest: MintosAnnualInterest): Observable<MintosAnnualInterest> {
    return this.mintosInterestData.save(interest);
  }

  loadB100History(tipo: B100Subcuenta, year: number, month: number, limit = 12, order = 'desc', force = false): void {
    this.b100Data.loadHistory(tipo, year, month, limit, order, force);
  }

  getB100BalancesByTipo(tipo: B100Subcuenta): B100Balance[] {
    return this.b100Data.getBalancesByTipo(tipo);
  }

  getB100Balance(tipo: B100Subcuenta, year: number, month: number): B100Balance | undefined {
    return this.b100Data.getBalance(tipo, year, month);
  }

  saveB100Balance(tipo: B100Subcuenta, year: number, month: number, data: B100BalanceSave): Observable<B100Balance> {
    return this.b100Data.save(tipo, year, month, data);
  }

  deleteB100Balance(id: string): Observable<any> {
    return this.b100Data.delete(id);
  }

  loadRevolutHistory(year: number, month: number, limit = 12, order = 'desc', force = false): void {
    this.revolutData.loadHistory(year, month, limit, order, force);
  }

  getRevolutBalances(): RevolutBalance[] {
    return this.revolutData.getBalances();
  }

  getRevolutBalance(year: number, month: number): RevolutBalance | undefined {
    return this.revolutData.getBalance(year, month);
  }

  saveRevolutBalance(year: number, month: number, data: RevolutBalanceSave): Observable<RevolutBalance> {
    return this.revolutData.save(year, month, data);
  }

  deleteRevolutBalance(id: string): Observable<any> {
    return this.revolutData.delete(id);
  }

  loadMintosHistory(year: number, month: number, force = false): void {
    this.mintosData.loadHistory(year, month, force);
  }

  getMintosBalances(): MintosBalance[] {
    return this.mintosData.getBalances();
  }

  getMintosBalance(year: number, month: number): MintosBalance | undefined {
    return this.mintosData.getBalance(year, month);
  }

  saveMintosBalance(year: number, month: number, data: MintosBalanceSave): Observable<MintosBalance> {
    return this.mintosData.save(year, month, data);
  }

  deleteMintosBalance(id: string): Observable<any> {
    return this.mintosData.delete(id);
  }
}
