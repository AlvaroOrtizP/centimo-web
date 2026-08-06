import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { FinancialDataService } from './financial-data.service';
import { MonthlySnapshot } from '../../models/monthly-snapshot';
import { InvestmentHolding } from '../../models/investment-holding';
import { Expense } from '../../models/expense';
import { IncomeSource } from '../../models/income-source';
import { InvestmentTransaction } from '../../models/investment-transaction';
import { provideApiMocks } from '../testing/api-mocks';
import { configureSeedSpies, applyFinancialSeed } from '../testing/test-seed';

describe('FinancialDataService', () => {
  let service: FinancialDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: provideApiMocks(),
    });
    configureSeedSpies();
    service = applyFinancialSeed();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have 11 mock platforms', () => {
    expect(service.platforms().length).toBe(11);
  });

  it('should have 15 mock accounts', () => {
    expect(service.accounts().length).toBe(15);
  });

  describe('getPlatform', () => {
    it('should find platform by id', () => {
      const p = service.getPlatform('bbva');
      expect(p).toBeDefined();
      expect(p!.name).toBe('BBVA');
    });

    it('should return undefined for unknown id', () => {
      expect(service.getPlatform('unknown')).toBeUndefined();
    });
  });

  describe('getAccountsByPlatform', () => {
    it('should return accounts for BBVA', () => {
      const accounts = service.getAccountsByPlatform('bbva');
      expect(accounts.length).toBe(1);
      expect(accounts[0].name).toBe('Cuenta Nómina');
    });

    it('should return 3 accounts for B100', () => {
      expect(service.getAccountsByPlatform('b100').length).toBe(3);
    });
  });

  describe('getSnapshotsByMonth', () => {
    it('should return snapshots for a valid month', () => {
      const snapshots = service.getSnapshotsByMonth(2026, 6);
      expect(snapshots.length).toBeGreaterThan(0);
    });

    it('should return empty for non-existent month', () => {
      const snapshots = service.getSnapshotsByMonth(2020, 1);
      expect(snapshots.length).toBe(0);
    });
  });

  describe('getMonthlySummary', () => {
    it('should compute correct totals', () => {
      const summary = service.getMonthlySummary(2026, 6);
      expect(summary.year).toBe(2026);
      expect(summary.month).toBe(6);
      expect(summary.totalBalance).toBe(30800);
      expect(summary.totalExpenses).toBe(890);
      expect(summary.netSavings).toBe(summary.totalIncome - summary.totalExpenses);
    });
  });

  describe('getPlatformHistory', () => {
    it('should return snapshots for BBVA platform', () => {
      const history = service.getPlatformHistory('bbva');
      expect(history.length).toBe(1);
    });
  });

  describe('getAvailableMonths', () => {
    it('should return sorted unique months', () => {
      const months = service.getAvailableMonths();
      expect(months.length).toBe(1);
      expect(months[0].month).toBe(6);
    });
  });

  describe('mutation methods', () => {
    it('addSnapshot should add a new snapshot', fakeAsync(() => {
      const newSnapshot: MonthlySnapshot = {
        id: 'test-acc-2026-07',
        accountId: 'bbva-checking',
        year: 2026,
        month: 7,
        balance: 3000,
        income: 2000,
        expenses: 1000,
      };
      service.addSnapshot(newSnapshot);
      tick();
      const found = service.getSnapshot('bbva-checking', 2026, 7);
      expect(found).toBeDefined();
      expect(found!.balance).toBe(3000);
    }));

    it('updateSnapshot should modify existing snapshot', () => {
      const existing = service.getSnapshot('bbva-checking', 2026, 6);
      expect(existing).toBeDefined();
      service.updateSnapshot(existing!.id, { balance: 9999 });
      const updated = service.getSnapshot('bbva-checking', 2026, 6);
      expect(updated!.balance).toBe(9999);
    });

    it('addHolding should add a holding', () => {
      const holding: InvestmentHolding = {
        id: 'hold-test',
        snapshotId: 'bbva-checking-2026-01',
        assetName: 'Test Asset',
        assetType: 'stock' as never,
        quantity: 10,
        valuePerUnit: 100,
        totalValue: 1000,
      };
      service.addHolding(holding);
      const holdings = service.getHoldingsBySnapshot('bbva-checking-2026-01');
      expect(holdings.some(h => h.id === 'hold-test')).toBeTrue();
    });

    it('addExpense should add an expense', fakeAsync(() => {
      const expense: Expense = {
        id: 'exp-test',
        snapshotId: 'bbva-checking-2026-01',
        category: 'Comida' as never,
        amount: 50,
        date: '2026-01-15',
      };
      service.addExpense(expense).subscribe();
      tick();
      const expenses = service.getExpensesBySnapshot('bbva-checking-2026-01');
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(50);
    }));

    it('addIncome should add an income', fakeAsync(() => {
      const income: IncomeSource = {
        id: 'inc-test',
        snapshotId: 'bbva-checking-2026-01',
        source: 'test',
        description: 'test income',
        amount: 100,
      };
      service.addIncome(income);
      tick();
      const incomes = service.getIncomesBySnapshot('bbva-checking-2026-01');
      expect(incomes.length).toBe(1);
      expect(incomes[0].amount).toBe(100);
    }));

    it('addTrade should add a trade', () => {
      const trade: InvestmentTransaction = {
        id: 'trade-test',
        accountId: 'bitvavo-main',
        assetName: 'TestCoin',
        assetType: 'crypto' as never,
        type: 'buy' as never,
        buyDate: '2026-07-01',
        buyQuantity: 1,
        buyPricePerUnit: 100,
        buyTotalCost: 100,
        status: 'open' as never,
      };
      service.addTrade(trade);
      const trades = service.getTradesByAccount('bitvavo-main');
      expect(trades.some(t => t.id === 'trade-test')).toBeTrue();
    });
  });
});
