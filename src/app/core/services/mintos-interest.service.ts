import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { MintosInteresesAnualesService } from '../../api/generated/api/mintosInteresesAnuales.service';
import { MintosInterestAnnual as MintosInterestAnnualApi } from '../../api/generated/model/mintosInterestAnnual';
import { MintosInterestAnnualCreate } from '../../api/generated/model/mintosInterestAnnualCreate';
import { MintosAnnualInterest } from '../../models';
import { roundMoney } from '../utils/money.util';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class MintosInterestDataService {
  private readonly api = inject(MintosInteresesAnualesService);
  private readonly logger = inject(LoggerService);

  readonly annualInterest = signal<MintosAnnualInterest | null>(null);

  getByYear(year: number): Observable<MintosAnnualInterest | null> {
    return this.api.listMintosInteresesAnuales(year).pipe(
      map(list => {
        const found = list.find(i => i.year === year) ?? null;
        return found ? this.mapFromApi(found) : null;
      }),
      tap(interest => this.annualInterest.set(interest)),
      catchError(err => {
        this.logger.error('MintosInterestData', 'getByYear error', err);
        return of(null);
      }),
    );
  }

  save(interest: MintosAnnualInterest): Observable<MintosAnnualInterest> {
    const body: MintosInterestAnnualCreate = {
      year: interest.year,
      amount: roundMoney(interest.amount) ?? 0,
      taxWithholding: roundMoney(interest.taxWithholding) ?? 0,
      taxRate: roundMoney(interest.taxRate) ?? 0,
      netAmount: roundMoney(interest.netAmount) ?? 0,
    };
    const request$ = interest.id
      ? this.api.updateMintosInteresAnual(interest.id, body)
      : this.api.createMintosInteresAnual(body);
    return request$.pipe(
      map(res => this.mapFromApi(res)),
      tap(res => this.annualInterest.set(res)),
      catchError(err => {
        this.logger.error('MintosInterestData', 'save error', err);
        throw err;
      }),
    );
  }

  private mapFromApi(api: MintosInterestAnnualApi): MintosAnnualInterest {
    return {
      id: api.id,
      year: api.year,
      amount: roundMoney(api.amount) ?? 0,
      taxWithholding: roundMoney(api.taxWithholding) ?? 0,
      taxRate: roundMoney(api.taxRate) ?? 0,
      netAmount: roundMoney(api.netAmount) ?? 0,
    };
  }
}
