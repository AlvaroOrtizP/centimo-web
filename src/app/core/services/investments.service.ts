import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// TODO(BACKEND): servicios y modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { CrowdlendingService } from '../../api/generated/api/crowdlending.service';
// import { CrowdlendingInvestment as CrowdlendingInvestmentApi } from '../../api/generated/model/crowdlendingInvestment';
// import { CrowdlendingInvestmentCreate } from '../../api/generated/model/crowdlendingInvestmentCreate';
// import { MyInvestorFundsService } from '../../api/generated/api/myInvestorFunds.service';
// import { FundBalancesService } from '../../api/generated/api/fundBalances.service';
// import { MyInvestorFundCreate } from '../../api/generated/model/myInvestorFundCreate';
// import { FundBalanceCreate } from '../../api/generated/model/fundBalanceCreate';
// import { FundBalanceUpdate } from '../../api/generated/model/fundBalanceUpdate';

import {
  CrowdlendingInvestment,
  MyInvestorFund,
  FundBalance,
} from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class InvestmentsDataService {
  // private readonly crowdlendingApi = inject(CrowdlendingService);
  // private readonly myInvestorFundsApi = inject(MyInvestorFundsService);
  // private readonly fundBalancesApi = inject(FundBalancesService);
  private readonly logger = inject(LoggerService);

  readonly crowdlending = signal<CrowdlendingInvestment[]>([]);
  readonly myInvestorFunds = signal<MyInvestorFund[]>([]);
  readonly fundBalances = signal<FundBalance[]>([]);

  getCrowdlendingByPlatform(platformId: string): CrowdlendingInvestment[] {
    return this.crowdlending().filter(c => c.platformId === platformId);
  }

  /** @deprecated El endpoint /crowdlending ya no se carga al iniciar la web. Solo se usa al entrar datos (entry-form). */
  loadAllCrowdlending(): void {
    // TODO(BACKEND): llamada a GET /crowdlending comentada.
  }

  addCrowdlendingInvestment(investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    // TODO(BACKEND): llamada a POST /crowdlending comentada.
    this.crowdlending.update(arr => [...arr, investment]);
    return of(investment);
  }

  deleteCrowdlendingInvestment(id: string): Observable<void> {
    // TODO(BACKEND): llamada a DELETE /crowdlending/{id} comentada.
    this.crowdlending.update(arr => arr.filter(c => c.id !== id));
    return of(undefined);
  }

  updateCrowdlendingInvestment(id: string, investment: CrowdlendingInvestment): Observable<CrowdlendingInvestment> {
    // TODO(BACKEND): llamada a PUT /crowdlending/{id} comentada.
    this.crowdlending.update(arr => arr.map(c => c.id === id ? investment : c));
    return of(investment);
  }

  addMyInvestorFund(fund: MyInvestorFund): Observable<MyInvestorFund> {
    // TODO(BACKEND): llamada a POST /myinvestor-funds comentada.
    this.myInvestorFunds.update(arr => [...arr, fund]);
    return of(fund);
  }

  updateMyInvestorFund(id: string, data: Partial<MyInvestorFund>): void {
    this.myInvestorFunds.update(arr => arr.map(f => f.id === id ? { ...f, ...data } : f));
  }

  deleteMyInvestorFund(id: string): Observable<void> {
    // TODO(BACKEND): llamada a DELETE /myinvestor-funds/{id} comentada.
    this.myInvestorFunds.update(arr => arr.filter(f => f.id !== id));
    return of(undefined);
  }

  /** @deprecated El endpoint /myinvestor-funds ya no se carga al iniciar la web. Solo se usa al entrar datos (entry-form). */
  loadAllMyInvestorFunds(): void {
    // TODO(BACKEND): llamada a GET /myinvestor-funds comentada.
  }

  loadFundBalances(year: number, month: number): void {
    // TODO(BACKEND): llamada a GET /fund-balances comentada.
  }

  getFundBalancesByMonth(year: number, month: number): FundBalance[] {
    return this.fundBalances().filter(b => b.year === year && b.month === month);
  }

  getFundBalance(fundId: string, year: number, month: number): FundBalance | undefined {
    return this.fundBalances().find(b => b.fundId === fundId && b.year === year && b.month === month);
  }

  addFundBalance(balance: FundBalance): Observable<FundBalance> {
    // TODO(BACKEND): llamada a POST /fund-balances comentada.
    this.fundBalances.update(arr => [...arr, balance]);
    return of(balance);
  }

  updateFundBalance(id: string, data: Partial<FundBalance>): Observable<FundBalance> {
    // TODO(BACKEND): llamada a PUT /fund-balances/{id} comentada.
    const existing = this.fundBalances().find(b => b.id === id);
    const updated: FundBalance = Object.assign({}, existing, data) as FundBalance;
    this.fundBalances.update(arr => arr.map(b => b.id === id ? updated : b));
    return of(updated);
  }

  deleteFundBalance(id: string): Observable<void> {
    // TODO(BACKEND): llamada a DELETE /fund-balances/{id} comentada.
    this.fundBalances.update(arr => arr.filter(b => b.id !== id));
    return of(undefined);
  }

  // TODO(BACKEND): pendiente de la nueva API.
  // private mapFromApi(api: CrowdlendingInvestmentApi): CrowdlendingInvestment {
  //   ...
  // }
}
