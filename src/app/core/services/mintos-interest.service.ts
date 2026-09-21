import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

// TODO(BACKEND): servicios y modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { MintosInteresesAnualesService } from '../../api/generated/api/mintosInteresesAnuales.service';
// import { MintosInterestAnnual as MintosInterestAnnualApi } from '../../api/generated/model/mintosInterestAnnual';
// import { MintosInterestAnnualCreate } from '../../api/generated/model/mintosInterestAnnualCreate';
import { MintosAnnualInterest } from '../../models';
import { roundMoney } from '../utils/money.util';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class MintosInterestDataService {
  // private readonly api = inject(MintosInteresesAnualesService);
  private readonly logger = inject(LoggerService);

  readonly annualInterest = signal<MintosAnnualInterest | null>(null);

  getByYear(year: number): Observable<MintosAnnualInterest | null> {
    // TODO(BACKEND): llamada a GET /mintos-intereses-anuales comentada.
    void year;
    this.annualInterest.set(null);
    return of(null);
  }

  save(interest: MintosAnnualInterest): Observable<MintosAnnualInterest> {
    // TODO(BACKEND): llamada a POST/PUT /mintos-intereses-anuales comentada.
    void roundMoney;
    this.annualInterest.set(interest);
    return of(interest);
  }

  // TODO(BACKEND): pendiente de la nueva API.
  // private mapFromApi(api: MintosInterestAnnualApi): MintosAnnualInterest { ... }
}
