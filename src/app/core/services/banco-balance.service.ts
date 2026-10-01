import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { BancoBalanceService } from '../../api/generated/api/bancoBalance.service';
import { BancoBalanceRequest } from '../../api/generated/model/bancoBalanceRequest';
import { BancoBalanceResponse } from '../../api/generated/model/bancoBalanceResponse';
import { BancoBalance, BancoBalanceSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class BancoBalanceDataService {
  private readonly bancoApi = inject(BancoBalanceService);
  private readonly logger = inject(LoggerService);

  readonly balances = signal<BancoBalance[]>([]);
  private readonly loadedSinces = new Map<string, string>();

  getBalances(entidad: string): BancoBalance[] {
    return this.balances().filter(b => b.entidad === entidad);
  }

  getBalance(entidad: string, year: number, month: number): BancoBalance | undefined {
    const mes = BancoBalanceDataService.toMes(year, month);
    return this.balances().find(b => b.entidad === entidad && b.mes === mes);
  }

  loadHistory(entidad: string, year: number, month: number, force = false): void {
    const since = BancoBalanceDataService.toMes(year, month);
    if (!force && this.loadedSinces.get(entidad) === since) { return; }
    this.loadedSinces.set(entidad, since);

    this.bancoApi.listBancoBalances(entidad).pipe(
      map(list => list.map(r => this.mapFromApi(r))),
      catchError((err) => {
        this.logger.error('BancoBalanceData', `loadHistory(${entidad}) error`, err);
        return of([]);
      }),
    ).subscribe(items => {
      this.balances.update(current => [
        ...current.filter(b => b.entidad !== entidad),
        ...items,
      ]);
    });
  }

  save(entidad: string, year: number, month: number, data: BancoBalanceSave): Observable<BancoBalance> {
    const mes = BancoBalanceDataService.toMes(year, month);
    const existing = this.getBalance(entidad, year, month);

    const request: BancoBalanceRequest = {
      entidad,
      mes,
      balanceMensual: data.balanceMensual,
      aporteMensual: data.aporteMensual,
    };

    const call$ = existing
      ? this.bancoApi.updateBancoBalance(existing.id, request)
      : this.bancoApi.createBancoBalance(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('BancoBalanceData', `save(${entidad}/${mes}) error`, err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<any> {
    return this.bancoApi.deleteBancoBalance(id).pipe(
      map(() => {
        this.balances.update(current => current.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('BancoBalanceData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: BancoBalanceResponse): BancoBalance {
    return {
      id: r.id,
      entidad: r.entidad,
      mes: r.mes,
      balanceMensual: r.balanceMensual,
      aporteMensual: r.aporteMensual,
    };
  }

  private upsertLocal(item: BancoBalance): void {
    this.balances.update(current => {
      const withoutPrevious = current.filter(b => !(b.entidad === item.entidad && b.mes === item.mes));
      return [...withoutPrevious, item];
    });
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}