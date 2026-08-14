import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { CrowdlendingService } from '../../api/generated/api/crowdlending.service';
import { CrowdlendingInvestment as CrowdlendingInvestmentApi } from '../../api/generated/model/crowdlendingInvestment';
import { CrowdlendingInvestmentCreate } from '../../api/generated/model/crowdlendingInvestmentCreate';
import { MyInvestorFundsService } from '../../api/generated/api/myInvestorFunds.service';
import { FundBalancesService } from '../../api/generated/api/fundBalances.service';
import { MyInvestorFundCreate } from '../../api/generated/model/myInvestorFundCreate';
import { FundBalanceCreate } from '../../api/generated/model/fundBalanceCreate';
import { FundBalanceUpdate } from '../../api/generated/model/fundBalanceUpdate';

import {
  InvestmentHolding,
  InvestmentTransaction,
  CrowdlendingInvestment,
  MyInvestorFund,
  FundBalance,
} from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class InvestmentsDataService {
  private readonly crowdlendingApi = inject(CrowdlendingService);
  private readonly myInvestorFundsApi = inject(MyInvestorFundsService);
  private readonly fundBalancesApi = inject(FundBalancesService);
  private readonly logger = inject(LoggerService);

  readonly holdings = signal<InvestmentHolding[]>([]);
  readonly trades = signal<InvestmentTransaction[]>([]);
  readonly crowdlending = signal<CrowdlendingInvestment[]>([]);
  readonly myInvestorFunds = signal<MyInvestorFund[]>([]);
  readonly fundBalances = signal<FundBalance[]>([]);

  getHoldingsBySnapshot(snapshotId: string): InvestmentHolding[] {
    return this.holdings().filter(h => h.snapshotId === snapshotId);
  }

  getTradesByAccount(accountId: string): InvestmentTransaction[] {
    return this.trades().filter(t => t.accountId === accountId);
  }

  getCrowdlendingByPlatform(platformId: string): CrowdlendingInvestment[] {
    return this.crowdlending().filter(c => c.platformId === platformId);
  }

  /** @deprecated El endpoint /crowdlending ya no se carga al iniciar la web. Solo se usa al entrar datos (entry-form). */
  loadAllCrowdlending(): void {
    this.crowdlendingApi.listCrowdlending().pipe(
      map(list => list.map(this.mapFromApi)),
      catchError(err => {
        this.logger.error('InvestmentsData', 'loadAllCrowdlending error', err);
        return of([]);
      }),
    ).subscribe(items => {
      this.crowdlending.set(items);
    });
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    const create: CrowdlendingInvestmentCreate = {
      platformId: investment.platformId,
      projectName: investment.projectName,
      investedAmount: investment.investedAmount,
      interestRate: investment.interestRate,
      termMonths: investment.termMonths,
      startDate: investment.startDate,
      endDate: investment.endDate ?? null,
      monthlyReturn: investment.monthlyReturn,
      totalReturned: investment.totalReturned,
      status: investment.status,
    };

    return this.crowdlendingApi.createCrowdlending(create).pipe(
      map(created => {
        const item = this.mapFromApi(created);
        this.crowdlending.update(arr => [...arr, item]);
        return item;
      }),
    );
  }

  deleteCrowdlendingInvestment(id: string): Observable<void> {
    return this.crowdlendingApi.deleteCrowdlending(id).pipe(
      map(() => {
        this.crowdlending.update(arr => arr.filter(c => c.id !== id));
      }),
      catchError(err => {
        this.logger.error('InvestmentsData', 'deleteCrowdlendingInvestment error', err);
        return of(undefined);
      }),
    );
  }

  updateCrowdlendingInvestment(id: string, investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    const create: CrowdlendingInvestmentCreate = {
      platformId: investment.platformId,
      projectName: investment.projectName,
      investedAmount: investment.investedAmount,
      interestRate: investment.interestRate,
      termMonths: investment.termMonths,
      startDate: investment.startDate,
      endDate: investment.endDate ?? null,
      monthlyReturn: investment.monthlyReturn,
      totalReturned: investment.totalReturned,
      status: investment.status,
    };

    return this.crowdlendingApi.updateCrowdlending(id, create).pipe(
      map(updated => {
        const item = this.mapFromApi(updated);
        this.crowdlending.update(arr => arr.map(c => c.id === item.id ? item : c));
        return item;
      }),
    );
  }

  addHolding(holding: InvestmentHolding): void {
    this.holdings.update(arr => [...arr, holding]);
  }

  deleteHolding(id: string): void {
    this.holdings.update(arr => arr.filter(h => h.id !== id));
  }

  addTrade(trade: InvestmentTransaction): void {
    this.trades.update(arr => [...arr, trade]);
  }

  deleteTrade(id: string): void {
    this.trades.update(arr => arr.filter(t => t.id !== id));
  }

  addMyInvestorFund(fund: MyInvestorFund): Observable<MyInvestorFund> {
    const create: MyInvestorFundCreate = {
      id: fund.id,
      code: fund.code,
      name: fund.name,
    };
    return this.myInvestorFundsApi.createMyInvestorFund(create).pipe(
      map(created => {
        this.myInvestorFunds.update(arr => [...arr, created]);
        return created;
      }),
    );
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): void {
    this.myInvestorFunds.update(arr => arr.map(f => f.id === id ? { ...f, ...data } : f));
  }

  deleteMyInvestorFund(id: string): Observable<void> {
    return this.myInvestorFundsApi.deleteMyInvestorFund(id).pipe(
      map(() => {
        this.myInvestorFunds.update(arr => arr.filter(f => f.id !== id));
      }),
      catchError(err => {
        this.logger.error('InvestmentsData', 'deleteMyInvestorFund error', err);
        return of(undefined);
      }),
    );
  }

  /** @deprecated El endpoint /myinvestor-funds ya no se carga al iniciar la web. Solo se usa al entrar datos (entry-form). */
  loadAllMyInvestorFunds(): void {
    this.myInvestorFundsApi.listMyInvestorFunds().pipe(
      catchError(err => {
        this.logger.error('InvestmentsData', 'loadAllMyInvestorFunds error', err);
        return of([]);
      }),
    ).subscribe(funds => {
      this.myInvestorFunds.set(funds);
    });
  }

  loadFundBalances(year: number, month: number): void {
    this.fundBalancesApi.listFundBalances(year, month).pipe(
      catchError(err => {
        this.logger.error('InvestmentsData', 'loadFundBalances error', err);
        return of([]);
      }),
    ).subscribe(balances => {
      this.fundBalances.update(arr => [
        ...arr.filter(b => !(b.year === year && b.month === month)),
        ...balances,
      ]);
    });
  }

  getFundBalancesByMonth(year: number, month: number): FundBalance[] {
    return this.fundBalances().filter(b => b.year === year && b.month === month);
  }

  getFundBalance(fundId: string, year: number, month: number): FundBalance | undefined {
    return this.fundBalances().find(b => b.fundId === fundId && b.year === year && b.month === month);
  }

  addFundBalance(balance: FundBalance): Observable<FundBalance> {
    const create: FundBalanceCreate = {
      fundId: balance.fundId,
      year: balance.year,
      month: balance.month,
      balance: balance.balance,
      income: balance.income,
      contribution: balance.contribution,
      expenses: balance.expenses,
    };
    return this.fundBalancesApi.createFundBalance(create).pipe(
      map(created => {
        this.fundBalances.update(arr => [...arr, created]);
        return created;
      }),
    );
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): Observable<FundBalance> {
    const update: FundBalanceUpdate = {
      balance: data.balance,
      income: data.income,
      contribution: data.contribution,
      expenses: data.expenses,
    };
    return this.fundBalancesApi.updateFundBalance(id, update).pipe(
      map(updated => {
        this.fundBalances.update(arr => arr.map(b => b.id === id ? { ...b, ...updated } : b));
        return updated;
      }),
    );
  }

  deleteFundBalance(id: string): Observable<void> {
    return this.fundBalancesApi.deleteFundBalance(id).pipe(
      map(() => {
        this.fundBalances.update(arr => arr.filter(b => b.id !== id));
      }),
      catchError(err => {
        this.logger.error('InvestmentsData', 'deleteFundBalance error', err);
        return of(undefined);
      }),
    );
  }

  private mapFromApi(api: CrowdlendingInvestmentApi): CrowdlendingInvestment {
    return {
      id: api.id,
      platformId: api.platformId,
      projectName: api.projectName,
      investedAmount: api.investedAmount,
      interestRate: api.interestRate,
      termMonths: api.termMonths,
      startDate: api.startDate,
      endDate: api.endDate ?? undefined,
      monthlyReturn: api.monthlyReturn,
      totalReturned: api.totalReturned,
      status: api.status,
    };
  }
}
