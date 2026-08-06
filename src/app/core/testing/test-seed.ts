import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { PlatformsService } from '../../api/generated/api/platforms.service';
import { AccountsService } from '../../api/generated/api/accounts.service';
import { SnapshotsService } from '../../api/generated/api/snapshots.service';
import { ExpensesService } from '../../api/generated/api/expenses.service';
import { IncomesService } from '../../api/generated/api/incomes.service';
import { MyInvestorFundsService } from '../../api/generated/api/myInvestorFunds.service';
import { FundBalancesService } from '../../api/generated/api/fundBalances.service';
import { FinancialDataService } from '../services/financial-data.service';
import { PlatformType } from '../../models/platform-type';
import { AccountType } from '../../models/account-type';

export const SEED_PLATFORMS = [
  { id: 'bbva', name: 'BBVA', type: PlatformType.Bank, color: '#004481', icon: '🏦', order: 1 },
  { id: 'myinvestor', name: 'MyInvestor', type: PlatformType.Investment, color: '#3B82F6', icon: '📈', order: 2 },
  { id: 'b100', name: 'B100', type: PlatformType.Bank, color: '#10B981', icon: '🏦', order: 3 },
  { id: 'revolut', name: 'Revolut', type: PlatformType.Bank, color: '#8B5CF6', icon: '💳', order: 4 },
  { id: 'mintos', name: 'Mintos', type: PlatformType.P2P, color: '#F59E0B', icon: '💼', order: 5 },
  { id: 'equito', name: 'Equito', type: PlatformType.Crowdlending, color: '#EC4899', icon: '🏗️', order: 6 },
  { id: 'urbanitae', name: 'Urbanitae', type: PlatformType.Crowdlending, color: '#EF4444', icon: '🏗️', order: 7 },
  { id: 'etoro', name: 'eToro', type: PlatformType.Investment, color: '#06B6D4', icon: '📊', order: 8 },
  { id: 'bitvavo', name: 'Bitvavo', type: PlatformType.Crypto, color: '#F97316', icon: '🪙', order: 9 },
  { id: 'caixa', name: 'Caixa', type: PlatformType.Bank, color: '#2563EB', icon: '🏦', order: 10 },
  { id: 'gastos', name: 'Gastos', type: PlatformType.Bank, color: '#EF4444', icon: '💸', order: 11 },
] as const;

export const SEED_ACCOUNTS = [
  { id: 'bbva-checking', platformId: 'bbva', name: 'Cuenta Nómina', type: AccountType.Checking, currency: 'EUR', order: 1 },
  { id: 'myinvestor-checking', platformId: 'myinvestor', name: 'Cuenta efectivo', type: AccountType.Checking, currency: 'EUR', order: 1 },
  { id: 'myinvestor-fondo', platformId: 'myinvestor', name: 'Cartera', type: AccountType.Investment, currency: 'EUR', order: 2 },
  { id: 'b100-checking', platformId: 'b100', name: 'Cuenta', type: AccountType.Checking, currency: 'EUR', order: 1 },
  { id: 'b100-savings', platformId: 'b100', name: 'Ahorro', type: AccountType.Savings, currency: 'EUR', order: 2 },
  { id: 'b100-investment', platformId: 'b100', name: 'Inversión', type: AccountType.Investment, currency: 'EUR', order: 3 },
  { id: 'revolut-main', platformId: 'revolut', name: 'Cuenta principal', type: AccountType.Checking, currency: 'EUR', order: 1 },
  { id: 'mintos-main', platformId: 'mintos', name: 'Cuenta Mintos', type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'equito-main', platformId: 'equito', name: 'Cuenta Equito', type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'urbanitae-main', platformId: 'urbanitae', name: 'Cuenta Urbanitae', type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'etoro-main', platformId: 'etoro', name: 'Cuenta eToro', type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'bitvavo-main', platformId: 'bitvavo', name: 'Cuenta Bitvavo', type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'caixa-main', platformId: 'caixa', name: 'Cuenta Caixa', type: AccountType.Checking, currency: 'EUR', order: 1 },
  { id: 'gastos-main', platformId: 'gastos', name: 'Gastos', type: AccountType.Checking, currency: 'EUR', order: 1 },
] as const;

export const SEED_JUNE_SNAPSHOTS = [
  { id: 'bbva-checking-2026-06', accountId: 'bbva-checking', year: 2026, month: 6, balance: 5000, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'myinvestor-checking-2026-06', accountId: 'myinvestor-checking', year: 2026, month: 6, balance: 0, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'myinvestor-fondo-2026-06', accountId: 'myinvestor-fondo', year: 2026, month: 6, balance: 8900, income: 63.7, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'b100-checking-2026-06', accountId: 'b100-checking', year: 2026, month: 6, balance: 0, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'b100-savings-2026-06', accountId: 'b100-savings', year: 2026, month: 6, balance: 4000, income: 8.4, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'b100-investment-2026-06', accountId: 'b100-investment', year: 2026, month: 6, balance: 2000, income: 12.3, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'revolut-main-2026-06', accountId: 'revolut-main', year: 2026, month: 6, balance: 3000, income: 15.5, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'mintos-main-2026-06', accountId: 'mintos-main', year: 2026, month: 6, balance: 1400, income: 50, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'equito-main-2026-06', accountId: 'equito-main', year: 2026, month: 6, balance: 2500, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'urbanitae-main-2026-06', accountId: 'urbanitae-main', year: 2026, month: 6, balance: 2000, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'etoro-main-2026-06', accountId: 'etoro-main', year: 2026, month: 6, balance: 0, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'bitvavo-main-2026-06', accountId: 'bitvavo-main', year: 2026, month: 6, balance: 0, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'caixa-main-2026-06', accountId: 'caixa-main', year: 2026, month: 6, balance: 2000, income: 0, expenses: 0, contribution: null, notes: null, checklistItems: null },
  { id: 'gastos-main-2026-06', accountId: 'gastos-main', year: 2026, month: 6, balance: 0, income: 0, expenses: 890, contribution: null, notes: null, checklistItems: null },
] as const;

export const SEED_FUNDS = [
  { id: 'mif-001', code: 'IE00B5BMR087', name: 'Amundi Indexado' },
  { id: 'mif-002', code: 'IE00B03HD191', name: 'Vanguard Global' },
  { id: 'mif-metal', code: 'GB00B4X3JQ46', name: 'Oro' },
] as const;

export const SEED_JUNE_FUND_BALANCES = [
  { id: 'fb-mif-001-2026-06', fundId: 'mif-001', year: 2026, month: 6, balance: 7700 },
  { id: 'fb-mif-metal-2026-06', fundId: 'mif-metal', year: 2026, month: 6, balance: 1200 },
] as const;

export function configureSeedSpies(): void {
  const platformsApi = TestBed.inject(PlatformsService) as jasmine.SpyObj<PlatformsService>;
  platformsApi.listPlatforms.and.returnValue(of(SEED_PLATFORMS) as never);

  const accountsApi = TestBed.inject(AccountsService) as jasmine.SpyObj<AccountsService>;
  accountsApi.listAccounts.and.returnValue(of(SEED_ACCOUNTS) as never);

  const snapshotsApi = TestBed.inject(SnapshotsService) as jasmine.SpyObj<SnapshotsService>;
  snapshotsApi.listSnapshots.and.returnValue(of(SEED_JUNE_SNAPSHOTS) as never);
  snapshotsApi.createSnapshot.and.callFake((create: never) => of({ ...(create as object), id: 'new-snap-id' }) as never);

  const expensesApi = TestBed.inject(ExpensesService) as jasmine.SpyObj<ExpensesService>;
  expensesApi.createExpense.and.callFake((create: never) => of({ ...(create as object), id: 'new-exp-id' }) as never);

  const incomesApi = TestBed.inject(IncomesService) as jasmine.SpyObj<IncomesService>;
  incomesApi.createIncome.and.callFake((create: never) => of({ ...(create as object), id: 'new-inc-id' }) as never);

  const fundsApi = TestBed.inject(MyInvestorFundsService) as jasmine.SpyObj<MyInvestorFundsService>;
  fundsApi.listMyInvestorFunds.and.returnValue(of(SEED_FUNDS) as never);
  fundsApi.createMyInvestorFund.and.callFake((create: never) => of(create) as never);
  fundsApi.deleteMyInvestorFund.and.returnValue(of(undefined) as never);

  const fundBalancesApi = TestBed.inject(FundBalancesService) as jasmine.SpyObj<FundBalancesService>;
  fundBalancesApi.listFundBalances.and.returnValue(of(SEED_JUNE_FUND_BALANCES) as never);
  fundBalancesApi.createFundBalance.and.callFake((create: never) => of({ ...(create as object), id: 'new-fb-id' }) as never);
  fundBalancesApi.updateFundBalance.and.callFake((id: never, update: never) => of({ ...(update as object), id }) as never);
  fundBalancesApi.deleteFundBalance.and.returnValue(of(undefined) as never);
}

export function applyFinancialSeed(): FinancialDataService {
  let service!: FinancialDataService;
  fakeAsync(() => {
    service = TestBed.inject(FinancialDataService);
    service.loadAllPlatforms();
    service.loadAllAccounts();
    service.loadAllSnapshots();
    service.loadAllCrowdlending();
    service.loadAllMyInvestorFunds();
    service.loadFundBalances(2026, 6);
    tick();
    TestBed.flushEffects();
  })();
  return service;
}
