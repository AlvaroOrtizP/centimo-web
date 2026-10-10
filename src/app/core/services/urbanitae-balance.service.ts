import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { UrbanitaeBalanceService } from '../../api/generated/api/urbanitaeBalance.service';
import { UrbanitaeBalanceRequest } from '../../api/generated/model/urbanitaeBalanceRequest';
import { UrbanitaeBalanceResponse } from '../../api/generated/model/urbanitaeBalanceResponse';
import { UrbanitaeBalance, UrbanitaeBalanceSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class UrbanitaeBalanceDataService {
  private readonly urbanitaeApi = inject(UrbanitaeBalanceService);
  private readonly logger = inject(LoggerService);

  readonly balances = signal<UrbanitaeBalance[]>([]);
  private loadedMes: string | null = null;

  getBalances(): UrbanitaeBalance[] {
    return this.balances();
  }

  getBalance(year: number, month: number): UrbanitaeBalance | undefined {
    const mes = UrbanitaeBalanceDataService.toMes(year, month);
    return this.balances().find(b => b.mes === mes);
  }

  loadHistory(year: number, month: number, force = false): void {
    const since = UrbanitaeBalanceDataService.toMes(year, month);
    if (!force && this.loadedMes === since) { return; }

    this.urbanitaeApi.listUrbanitaeBalances().pipe(
      map(list => list.map(r => this.mapFromApi(r))),
      catchError((err) => {
        this.logger.error('UrbanitaeBalanceData', 'loadHistory error', err);
        return of([]);
      }),
    ).subscribe(items => {
      this.loadedMes = since;
      this.balances.set(items);
    });
  }

  save(year: number, month: number, data: UrbanitaeBalanceSave): Observable<UrbanitaeBalance> {
    const mes = UrbanitaeBalanceDataService.toMes(year, month);
    const existing = this.getBalance(year, month);

    const request: UrbanitaeBalanceRequest = {
      mes,
      balanceMensual: data.balanceMensual,
      aporteMensual: data.aporteMensual,
      dineroTotal: data.dineroTotal,
      dineroHacienda: data.dineroHacienda,
      dineroFinal: data.dineroFinal,
    };

    const call$ = existing
      ? this.urbanitaeApi.updateUrbanitaeBalance(existing.id, request)
      : this.urbanitaeApi.createUrbanitaeBalance(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('UrbanitaeBalanceData', `save(${mes}) error`, err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<any> {
    return this.urbanitaeApi.deleteUrbanitaeBalance(id).pipe(
      map(() => {
        this.balances.update(current => current.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('UrbanitaeBalanceData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: UrbanitaeBalanceResponse): UrbanitaeBalance {
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

  private upsertLocal(item: UrbanitaeBalance): void {
    this.balances.update(current => {
      const withoutPrevious = current.filter(b => b.mes !== item.mes);
      return [...withoutPrevious, item];
    });
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}