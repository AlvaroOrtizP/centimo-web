import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

// TODO(BACKEND): servicios y modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { IncomesService } from '../../api/generated/api/incomes.service';
// import { NominaService } from '../../api/generated/api/nomina.service';
// import { IncomeSourceCreate } from '../../api/generated/model/incomeSourceCreate';
// import { NominaCreate } from '../../api/generated/model/nominaCreate';
// import { NominaResponse } from '../../api/generated/model/nominaResponse';
import { IncomeSource } from '../../models';

@Injectable({ providedIn: 'root' })
export class IncomesDataService {
  // private readonly incomesApi = inject(IncomesService);
  // private readonly nominaApi = inject(NominaService);

  readonly incomes = signal<IncomeSource[]>([]);

  getIncomesBySnapshot(snapshotId: string): IncomeSource[] {
    return this.incomes().filter(i => i.snapshotId === snapshotId);
  }

  fetchNominaFromBackend(year: number, month: number): Observable<any | null> {
    // TODO(BACKEND): llamada a GET /nomina comentada.
    void year; void month;
    return of(null);
  }

  createNomina(nomina: any): Observable<any | null> {
    // TODO(BACKEND): llamada a POST /nomina comentada.
    void nomina;
    return of(null);
  }

  addIncome(income: IncomeSource): void {
    // TODO(BACKEND): llamada a POST /incomes comentada.
    this.incomes.update(arr => [...arr, income]);
  }

  deleteIncome(id: string): void {
    this.incomes.update(arr => arr.filter(i => i.id !== id));
  }
}
