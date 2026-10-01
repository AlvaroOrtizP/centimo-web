import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { MintosInteresesAnualesService } from '../../api/generated/api/mintosInteresesAnuales.service';
import { MintosInterestAnnualCreate } from '../../api/generated/model/mintosInterestAnnualCreate';
import { MintosInterestAnnual } from '../../api/generated/model/mintosInterestAnnual';
import { MintosBalance, MintosBalanceSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class MintosBalanceDataService {
  private readonly mintosApi = inject(MintosInteresesAnualesService);
  private readonly logger = inject(LoggerService);

  readonly balances = signal<MintosBalance[]>([]);
  private loadedMes: string | null = null;

  getBalances(): MintosBalance[] {
    return this.balances();
  }

  getBalance(year: number, month: number): MintosBalance | undefined {
    const mes = MintosBalanceDataService.toMes(year, month);
    return this.balances().find(b => b.mes === mes);
  }

  loadHistory(year: number, month: number, force = false): void {
    const since = MintosBalanceDataService.toMes(year, month);
    if (!force && this.loadedMes === since) { return; }
    this.loadedMes = since;

    this.mintosApi.listInteresesAnuales().pipe(
      map(list => list.map(r => this.mapFromApi(r))),
      catchError((err) => {
        this.logger.error('MintosBalanceData', 'loadHistory error', err);
        return of([]);
      }),
    ).subscribe(items => {
      this.loadedMes = since;
      this.balances.set(items);
    });
  }

  save(year: number, month: number, data: MintosBalanceSave): Observable<MintosBalance> {
    const mes = MintosBalanceDataService.toMes(year, month);
    const existing = this.getBalance(year, month);

    const request: MintosInterestAnnualCreate = {
      mes,
      importeAñadido: data.importeAnadido,
      valorFinal: data.valorFinal,
    };

    const call$ = existing
      ? this.mintosApi.updateInteresAnual(existing.id, request)
      : this.mintosApi.createInteresAnual(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('MintosBalanceData', `save(${mes}) error`, err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<any> {
    return this.mintosApi.deleteInteresAnual(id).pipe(
      map(() => {
        this.balances.update(current => current.filter(b => b.id !== id));
      }),
      catchError((err) => {
        this.logger.error('MintosBalanceData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: MintosInterestAnnual): MintosBalance {
    return {
      id: r.id,
      mes: r.mes,
      importeAnadido: r.importeAñadido,
      valorFinal: r.valorFinal,
    };
  }

  private upsertLocal(item: MintosBalance): void {
    this.balances.update(current => {
      const withoutPrevious = current.filter(b => b.mes !== item.mes);
      return [...withoutPrevious, item];
    });
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}