import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { IncomesService } from '../../api/generated/api/incomes.service';
import { NominaService } from '../../api/generated/api/nomina.service';
import { IncomeSourceCreate } from '../../api/generated/model/incomeSourceCreate';
import { NominaCreate } from '../../api/generated/model/nominaCreate';
import { NominaResponse } from '../../api/generated/model/nominaResponse';
import { IncomeSource } from '../../models';

@Injectable({ providedIn: 'root' })
export class IncomesDataService {
  private readonly incomesApi = inject(IncomesService);
  private readonly nominaApi = inject(NominaService);

  readonly incomes = signal<IncomeSource[]>([]);

  getIncomesBySnapshot(snapshotId: string): IncomeSource[] {
    return this.incomes().filter(i => i.snapshotId === snapshotId);
  }

  fetchNominaFromBackend(year: number, month: number): Observable<NominaResponse | null> {
    return this.nominaApi.getNominaAndDate(year, month).pipe(
      map(response => response as NominaResponse),
      catchError((error: HttpErrorResponse) => {
        return error.status === 404 ? of(null) : of(null);
      }),
    );
  }

  createNomina(nomina: NominaCreate): Observable<NominaResponse | null> {
    return this.nominaApi.createNomina(nomina).pipe(
      map(response => response as NominaResponse),
      catchError((error: HttpErrorResponse) => {
        return of(null);
      }),
    );
  }

  addIncome(income: IncomeSource): void {
    const create: IncomeSourceCreate = {
      snapshotId: income.snapshotId,
      source: income.source,
      description: income.description,
      amount: income.amount,
    };
    this.incomesApi.createIncome(create).subscribe(created => {
      this.incomes.update(arr => [...arr, {
        id: created.id,
        snapshotId: created.snapshotId,
        source: created.source,
        description: created.description,
        amount: created.amount,
      }]);
    });
  }

  deleteIncome(id: string): void {
    this.incomes.update(arr => arr.filter(i => i.id !== id));
  }
}
