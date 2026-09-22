import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { RevolutBalanceService } from '../../api/generated/api/revolutBalance.service';
import { RevolutBalanceRequest } from '../../api/generated/model/revolutBalanceRequest';
import { RevolutBalanceResponse } from '../../api/generated/model/revolutBalanceResponse';
import { RevolutBalance, RevolutBalanceSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class RevolutBalanceDataService {
  private readonly revolutApi = inject(RevolutBalanceService);
  private readonly logger = inject(LoggerService);

  readonly balances = signal<RevolutBalance[]>([]);
  private loadedMes: string | null = null;

  getBalances(): RevolutBalance[] {
    return this.balances();
  }

  getBalance(year: number, month: number): RevolutBalance | undefined {
    const mes = RevolutBalanceDataService.toMes(year, month);
    return this.balances().find(b => b.mes === mes);
  }

  loadHistory(year: number, month: number, limit = 12, order = 'desc', force = false): void {
    const since = RevolutBalanceDataService.toMes(year, month);
    if (!force && this.loadedMes === since && this.balances().length > 0) { return; }

    this.revolutApi.listRevolutBalances(limit, order).pipe(
      map(list => list.map(r => this.mapFromApi(r))),
      catchError((err) => {
        this.logger.error('RevolutBalanceData', 'loadHistory error', err);
        return of([]);
      }),
    ).subscribe(items => {
      this.loadedMes = since;
      this.balances.set(items);
    });
  }

  save(year: number, month: number, data: RevolutBalanceSave): Observable<RevolutBalance> {
    const mes = RevolutBalanceDataService.toMes(year, month);
    const existing = this.getBalance(year, month);

    const request: RevolutBalanceRequest = {
      mes,
      balanceMensual: data.balanceMensual,
      aporteMensual: data.aporteMensual,
      dineroTotal: data.dineroTotal,
      dineroHacienda: data.dineroHacienda,
      dineroFinal: data.dineroFinal,
    };

    const call$ = existing
      ? this.revolutApi.updateRevolutBalance(existing.id, request)
      : this.revolutApi.createRevolutBalance(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('RevolutBalanceData', `save(${mes}) error`, err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<any> {
    return this.revolutApi.deleteRevolutBalance(id).pipe(
      map(() => {
        this.balances.update(current => current.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('RevolutBalanceData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: RevolutBalanceResponse): RevolutBalance {
    return {
      id: r.id,
      mes: r.mes,
      balanceMensual: r.balanceMensual,
      aporteMensual: r.aporteMensual,
      dineroTotal: r.dineroTotal,
      dineroHacienda: r.dineroHacienda,
      dineroFinal: r.dineroFinal,
    };
  }

  private upsertLocal(item: RevolutBalance): void {
    this.balances.update(current => {
      const withoutPrevious = current.filter(b => b.mes !== item.mes);
      return [...withoutPrevious, item];
    });
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}