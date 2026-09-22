import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { B100BalanceService } from '../../api/generated/api/b100Balance.service';
import { B100BalanceRequest } from '../../api/generated/model/b100BalanceRequest';
import { B100BalanceResponse } from '../../api/generated/model/b100BalanceResponse';
import { B100Balance, B100BalanceSave, B100Subcuenta } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class B100BalanceDataService {
  private readonly b100Api = inject(B100BalanceService);
  private readonly logger = inject(LoggerService);

  readonly balances = signal<B100Balance[]>([]);
  private readonly loadedMes = new Map<B100Subcuenta, string>();

  getBalancesByTipo(tipo: B100Subcuenta): B100Balance[] {
    return this.balances().filter(b => b.tipoSubcuenta === tipo);
  }

  getBalance(tipo: B100Subcuenta, year: number, month: number): B100Balance | undefined {
    const mes = B100BalanceDataService.toMes(year, month);
    return this.balances().find(b => b.tipoSubcuenta === tipo && b.mes === mes);
  }

  loadHistory(tipo: B100Subcuenta, year: number, month: number, limit = 12, order = 'desc', force = false): void {
    const since = B100BalanceDataService.toMes(year, month);
    if (!force && this.loadedMes.get(tipo) === since && this.getBalancesByTipo(tipo).length > 0) { return; }

    this.b100Api.listB100Balances(tipo, since, limit, order).pipe(
      map(list => list.map(r => this.mapFromApi(r))),
      catchError((err) => {
        this.logger.error('B100BalanceData', `loadHistory(${tipo}) error`, err);
        return of([]);
      }),
    ).subscribe(items => {
      this.loadedMes.set(tipo, since);
      this.balances.update(current => [...current.filter(b => b.tipoSubcuenta !== tipo), ...items]);
    });
  }

  save(tipo: B100Subcuenta, year: number, month: number, data: B100BalanceSave): Observable<B100Balance> {
    const mes = B100BalanceDataService.toMes(year, month);
    const existing = this.getBalance(tipo, year, month);

    const request: B100BalanceRequest = {
      tipoSubcuenta: tipo,
      mes,
      balanceMensual: data.balanceMensual,
      dineroTotalRepartir: data.dineroTotalRepartir,
      aporteMensual: data.aporteMensual,
      dineroHacienda: data.dineroHacienda,
      porcentajeHacienda: data.porcentajeHacienda,
    };

    const call$ = existing
      ? this.b100Api.updateB100Balance(existing.id, request)
      : this.b100Api.createB100Balance(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('B100BalanceData', `save(${tipo}) error`, err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<any> {
    return this.b100Api.deleteB100Balance(id).pipe(
      map(() => {
        this.balances.update(current => current.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('B100BalanceData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: B100BalanceResponse): B100Balance {
    return {
      id: r.id,
      tipoSubcuenta: r.tipoSubcuenta as B100Subcuenta,
      mes: r.mes,
      balanceMensual: r.balanceMensual,
      aporteMensual: r.aporteMensual,
      dineroHacienda: r.dineroHacienda,
      dineroTotalRepartir: r.dineroTotalRepartir,
      porcentajeHacienda: r.porcentajeHacienda,
    };
  }

  private upsertLocal(item: B100Balance): void {
    this.balances.update(current => {
      const withoutPrevious = current.filter(b => !(b.tipoSubcuenta === item.tipoSubcuenta && b.mes === item.mes));
      return [...withoutPrevious, item];
    });
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}