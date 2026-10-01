import { Injectable, signal } from '@angular/core';

// TODO(BACKEND): servicio y modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { IncomesService } from '../../api/generated/api/incomes.service';
// import { IncomeSourceCreate } from '../../api/generated/model/incomeSourceCreate';
import { IncomeSource } from '../../models';

@Injectable({ providedIn: 'root' })
export class IncomesDataService {
  // private readonly incomesApi = inject(IncomesService);

  readonly incomes = signal<IncomeSource[]>([]);

  getIncomesBySnapshot(snapshotId: string): IncomeSource[] {
    return this.incomes().filter(i => i.snapshotId === snapshotId);
  }

  addIncome(income: IncomeSource): void {
    // TODO(BACKEND): llamada a POST /incomes comentada.
    this.incomes.update(arr => [...arr, income]);
  }

  deleteIncome(id: string): void {
    this.incomes.update(arr => arr.filter(i => i.id !== id));
  }
}
