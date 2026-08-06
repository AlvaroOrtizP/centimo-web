import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { CrowdlendingService } from '../../api/generated/api/crowdlending.service';
import { CrowdlendingInvestment as CrowdlendingInvestmentApi } from '../../api/generated/model/crowdlendingInvestment';
import { CrowdlendingInvestmentCreate } from '../../api/generated/model/crowdlendingInvestmentCreate';

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

  addFundBalance(balance: FundBalance): void {
    this.fundBalances.update(arr => [...arr, balance]);
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): void {
    this.fundBalances.update(arr => arr.map(b => b.id === id ? { ...b, ...data } : b));
  }

  deleteFundBalance(id: string): void {
    this.fundBalances.update(arr => arr.filter(b => b.id !== id));
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
