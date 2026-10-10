import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { EquitoBalanceService } from '../../api/generated/api/equitoBalance.service';
import { EquitoBalanceRequest } from '../../api/generated/model/equitoBalanceRequest';
import { EquitoBalanceResponse } from '../../api/generated/model/equitoBalanceResponse';
import { EquitoBalance, EquitoBalanceSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class EquitoBalanceDataService {
  private readonly equitoApi = inject(EquitoBalanceService);
  private readonly logger = inject(LoggerService);

  readonly balances = signal<EquitoBalance[]>([]);
  private loadedMes = '';

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  getBalances(): EquitoBalance[] {
    return this.balances();
  }

  getBalance(year: number, month: number): EquitoBalance | undefined {
    const mes = EquitoBalanceDataService.toMes(year, month);
    return this.balances().find(b => b.mes === mes);
  }

  loadHistory(year: number, month: number, force = false): void {
    const since = EquitoBalanceDataService.toMes(year, month);
    if (!force && this.loadedMes === since) { return; }
    this.loadedMes = since;

    this.equitoApi.listEquitoBalances(undefined, 'desc').pipe(
      map(list => list.map(r => this.mapFromApi(r))),
      catchError((err) => {
        this.loadedMes = since;
        this.logger.error('EquitoBalanceData', 'loadHistory error', err);
        return of<EquitoBalance[]>([]);
      }),
    ).subscribe(items => {
      this.loadedMes = since;
      this.balances.set(items);
    });
  }

  save(year: number, month: number, data: EquitoBalanceSave): Observable<EquitoBalance> {
    const request: EquitoBalanceRequest = { mes: EquitoBalanceDataService.toMes(year, month), ...data };

    const existing = this.getBalance(year, month);
    const call$ = existing
      ? this.equitoApi.updateEquitoBalance(existing.id, request)
      : this.equitoApi.createEquitoBalance(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(balance => this.upsertLocal(balance)),
      catchError((err) => {
        this.logger.error('EquitoBalanceData', 'save error', err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<any> {
    return this.equitoApi.deleteEquitoBalance(id).pipe(
      map(() => {
        this.balances.update(current => current.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('EquitoBalanceData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: EquitoBalanceResponse): EquitoBalance {
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

  private upsertLocal(balance: EquitoBalance): void {
    this.balances.update(current => {
      const withoutPrevious = current.filter(b => b.id !== balance.id);
      return [...withoutPrevious, balance];
    });
  }
}