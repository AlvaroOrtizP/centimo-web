import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { MyInvestorFundsService } from '../../api/generated/api/myInvestorFunds.service';
import { FundBalancesService } from '../../api/generated/api/fundBalances.service';
import { MyInvestorFundCreate } from '../../api/generated/model/myInvestorFundCreate';
import { MyInvestorFundUpdate } from '../../api/generated/model/myInvestorFundUpdate';
import { MyInvestorFund as MyInvestorFundApi } from '../../api/generated/model/myInvestorFund';
import { FundBalanceCreate } from '../../api/generated/model/fundBalanceCreate';
import { FundBalanceUpdate } from '../../api/generated/model/fundBalanceUpdate';
import { FundBalance as FundBalanceApi } from '../../api/generated/model/fundBalance';

import {
  CrowdlendingInvestment,
  MyInvestorFund,
  FundBalance,
} from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class InvestmentsDataService {
  private readonly myInvestorFundsApi = inject(MyInvestorFundsService);
  private readonly fundBalancesApi = inject(FundBalancesService);
  private readonly logger = inject(LoggerService);

  readonly crowdlending = signal<CrowdlendingInvestment[]>([]);
  readonly myInvestorFunds = signal<MyInvestorFund[]>([]);
  readonly fundBalances = signal<FundBalance[]>([]);

  private fundsLoaded = false;
  private readonly loadedBalanceMonths = new Set<string>();

  getCrowdlendingByPlatform(platformId: string): CrowdlendingInvestment[] {
    return this.crowdlending().filter(c => c.platformId === platformId);
  }

  /** @deprecated El endpoint /crowdlending ya no se usa. Las plataformas de crowdlending usan sus propias entidades (compras). */
  loadAllCrowdlending(): void {
    // no-op: crowdlending genérico sin backend.
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    this.crowdlending.update(arr => [...arr, investment]);
    return of(investment);
  }

  deleteCrowdlendingInvestment(id: string): Observable<void> {
    this.crowdlending.update(arr => arr.filter(c => c.id !== id));
    return of(undefined);
  }

  updateCrowdlendingInvestment(id: string, investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    this.crowdlending.update(arr => arr.map(c => c.id === id ? investment : c));
    return of(investment);
  }

  loadAllMyInvestorFunds(): void {
    if (this.fundsLoaded) { return; }
    this.fundsLoaded = true;

    this.myInvestorFundsApi.listMyInvestorFunds().pipe(
      map(list => list.map(r => this.mapFundFromApi(r))),
      catchError((err) => {
        this.logger.error('InvestmentsData', 'loadAllMyInvestorFunds error', err);
        return of<MyInvestorFund[]>([]);
      }),
    ).subscribe(items => {
      this.myInvestorFunds.set(items);
    });
  }

  addMyInvestorFund(fund: MyInvestorFund): Observable<MyInvestorFund> {
    if (this.myInvestorFunds().some(f => f.id === fund.id)) {
      return this.updateMyInvestorFund(fund.id, { name: fund.name, code: fund.code, tipo: fund.tipo });
    }

    const request: MyInvestorFundCreate = {
      id: fund.id,
      code: fund.code,
      name: fund.name,
      tipo: fund.tipo,
    };

    return this.myInvestorFundsApi.createMyInvestorFund(request).pipe(
      map(r => this.mapFundFromApi(r)),
      tap(item => this.upsertFundLocal(item)),
      catchError((err) => {
        this.logger.error('InvestmentsData', 'addMyInvestorFund error', err);
        throw err;
      }),
    );
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): Observable<MyInvestorFund> {
    const request: MyInvestorFundUpdate = {
      code: data.code,
      name: data.name,
      tipo: data.tipo,
    };

    return this.myInvestorFundsApi.updateMyInvestorFund(id, request).pipe(
      map(r => this.mapFundFromApi(r)),
      tap(item => this.upsertFundLocal(item)),
      catchError((err) => {
        this.logger.error('InvestmentsData', `updateMyInvestorFund(${id}) error`, err);
        throw err;
      }),
    );
  }

  deleteMyInvestorFund(id: string): Observable<void> {
    return this.myInvestorFundsApi.deleteMyInvestorFund(id).pipe(
      map(() => {
        this.myInvestorFunds.update(arr => arr.filter(f => f.id !== id));
      }),
      catchError((err) => {
        this.logger.error('InvestmentsData', `deleteMyInvestorFund(${id}) error`, err);
        throw err;
      }),
    );
  }

  loadFundBalances(year: number, month: number): void {
    const key = InvestmentsDataService.monthKey(year, month);
    if (this.loadedBalanceMonths.has(key)) { return; }
    this.loadedBalanceMonths.add(key);

    this.fundBalancesApi.listFundBalances(year, month).pipe(
      map(list => list.map(r => this.mapBalanceFromApi(r))),
      catchError((err) => {
        this.logger.error('InvestmentsData', `loadFundBalances(${key}) error`, err);
        return of<FundBalance[]>([]);
      }),
    ).subscribe(items => {
      this.upsertBalanceMonthLocal(year, month, items);
    });
  }

  getFundBalancesByMonth(year: number, month: number): FundBalance[] {
    return this.fundBalances().filter(b => b.year === year && b.month === month);
  }

  getFundBalance(fundId: string, year: number, month: number): FundBalance | undefined {
    return this.fundBalances().find(b => b.fundId === fundId && b.year === year && b.month === month);
  }

  addFundBalance(balance: FundBalance): Observable<FundBalance> {
    const existing = this.getFundBalance(balance.fundId, balance.year, balance.month);
    if (existing) {
      return this.updateFundBalance(existing.id, balance);
    }

    const request: FundBalanceCreate = {
      fundId: balance.fundId,
      year: balance.year,
      month: balance.month,
      balance: balance.balance ?? 0,
      income: balance.income,
      contribution: balance.contribution,
      expenses: balance.expenses,
    };

    return this.fundBalancesApi.createFundBalance(request).pipe(
      map(r => this.mapBalanceFromApi(r)),
      tap(item => this.upsertBalanceLocal(item)),
      catchError((err) => {
        this.logger.error('InvestmentsData', 'addFundBalance error', err);
        throw err;
      }),
    );
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): Observable<FundBalance> {
    const request: FundBalanceUpdate = {
      balance: data.balance,
      income: data.income,
      contribution: data.contribution,
      expenses: data.expenses,
    };

    return this.fundBalancesApi.updateFundBalance(id, request).pipe(
      map(r => this.mapBalanceFromApi(r)),
      tap(item => this.upsertBalanceLocal(item)),
      catchError((err) => {
        this.logger.error('InvestmentsData', `updateFundBalance(${id}) error`, err);
        throw err;
      }),
    );
  }

  deleteFundBalance(id: string): Observable<void> {
    return this.fundBalancesApi.deleteFundBalance(id).pipe(
      map(() => {
        this.fundBalances.update(arr => arr.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('InvestmentsData', `deleteFundBalance(${id}) error`, err);
        throw err;
      }),
    );
  }

  private static monthKey(year: number, month: number): string {
    return `${year}-${month}`;
  }

  private upsertBalanceMonthLocal(year: number, month: number, items: FundBalance[]): void {
    this.fundBalances.update(current => {
      const withoutMonth = current.filter(b => !(b.year === year && b.month === month));
      return [...withoutMonth, ...items];
    });
  }

  private upsertBalanceLocal(item: FundBalance): void {
    this.fundBalances.update(current => {
      const withoutPrevious = current.filter(b => b.id !== item.id);
      return [...withoutPrevious, item];
    });
  }

  private upsertFundLocal(fund: MyInvestorFund): void {
    this.myInvestorFunds.update(current => {
      const withoutPrevious = current.filter(f => f.id !== fund.id);
      return [...withoutPrevious, fund];
    });
  }

  private mapFundFromApi(api: MyInvestorFundApi): MyInvestorFund {
    return {
      id: api.id,
      code: api.code,
      name: api.name,
      tipo: api.tipo as MyInvestorFund['tipo'],
    };
  }

  private mapBalanceFromApi(api: FundBalanceApi): FundBalance {
    return {
      id: api.id,
      fundId: api.fundId,
      year: api.year,
      month: api.month,
      balance: api.balance ?? 0,
      income: api.income,
      contribution: api.contribution,
      expenses: api.expenses,
    };
  }
}