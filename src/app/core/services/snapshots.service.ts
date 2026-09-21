import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// TODO(BACKEND): servicios y modelos eliminados del swagger (solo queda B100). Se reactivarán al ampliar la nueva API.
// import { SnapshotsService } from '../../api/generated/api/snapshots.service';
// import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';
// import { SnapshotUpsert } from '../../api/generated/model/snapshotUpsert';
// import { MonthlySnapshotCreate } from '../../api/generated/model/monthlySnapshotCreate';
// import { MonthlySnapshotUpdate } from '../../api/generated/model/monthlySnapshotUpdate';
import { MonthlySnapshot } from '../../models';
import { roundMoney } from '../utils/money.util';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SnapshotsDataService {
  // private readonly snapshotsApi = inject(SnapshotsService); // TODO(BACKEND): API comentada
  private readonly logger = inject(LoggerService);

  readonly snapshots = signal<MonthlySnapshot[]>([]);

  getSnapshotsByAccount(accountId: string): MonthlySnapshot[] {
    return this.snapshots().filter(s => s.accountId === accountId);
  }

  getSnapshotsByMonth(year: number, month: number): MonthlySnapshot[] {
    const y = Number(year);
    const m = Number(month);
    return this.snapshots().filter(s => s.year === y && s.month === m);
  }

  getSnapshot(accountId: string, year: number, month: number): MonthlySnapshot | undefined {
    const y = Number(year);
    const m = Number(month);
    return this.snapshots().find(s => s.accountId === accountId && s.year === y && s.month === m);
  }

  loadAllSnapshots(force = false): void {
    if (force) {
      this.snapshots.set([]);
    } else if (this.snapshots().length > 0) {
      return;
    }
    // TODO(BACKEND): llamada a GET /snapshots comentada.
    // this.snapshotsApi.listSnapshots().pipe(
    //   map(list => list.map(s => ({
    //     id: s.id,
    //     accountId: s.accountId,
    //     year: s.year,
    //     month: s.month,
    //     balance: roundMoney(s.balance ?? 0) ?? 0,
    //     income: roundMoney(s.income ?? 0) ?? 0,
    //     expenses: roundMoney(s.expenses ?? 0) ?? 0,
    //     contribution: s.contribution != null ? roundMoney(s.contribution) ?? undefined : undefined,
    //     tax: s.tax != null ? roundMoney(s.tax) ?? undefined : undefined,
    //     notes: s.notes ?? undefined,
    //     checklistItems: s.checklistItems ?? undefined,
    //   }))),
    //   catchError((err) => {
    //     this.logger.error('SnapshotsData', 'loadAllSnapshots error', err);
    //     return of([]);
    //   }),
    // ).subscribe(snapshots => {
    //   this.snapshots.set(snapshots);
    // });
  }

  /** Carga instantáneas desde el backend filtradas por año (y opcionalmente cuenta) y las fusiona. */
  loadSnapshotsByYear(year: number, accountId?: string): void {
    // TODO(BACKEND): llamada a GET /snapshots (por año) comentada.
    // this.snapshotsApi.listSnapshots(year, accountId).pipe(
    //   map(list => list.map(s => ({
    //     id: s.id,
    //     accountId: s.accountId,
    //     year: s.year,
    //     month: s.month,
    //     balance: roundMoney(s.balance ?? 0) ?? 0,
    //     income: roundMoney(s.income ?? 0) ?? 0,
    //     expenses: roundMoney(s.expenses ?? 0) ?? 0,
    //     contribution: s.contribution != null ? roundMoney(s.contribution) ?? undefined : undefined,
    //     tax: s.tax != null ? roundMoney(s.tax) ?? undefined : undefined,
    //     notes: s.notes ?? undefined,
    //     checklistItems: s.checklistItems ?? undefined,
    //   }))),
    //   catchError((err) => {
    //     this.logger.error('SnapshotsData', 'loadSnapshotsByYear error', err);
    //     return of([]);
    //   }),
    // ).subscribe(snapshots => {
    //   this.snapshots.update(current => {
    //     const others = accountId
    //       ? current.filter(s => !(s.year === year && s.accountId === accountId))
    //       : current.filter(s => s.year !== year);
    //     return [...others, ...snapshots];
    //   });
    // });
  }


  addSnapshot(snapshot: MonthlySnapshot): void {
    // TODO(BACKEND): llamada a POST /snapshots comentada.
    this.snapshots.update(arr => [...arr, snapshot]);
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    // TODO(BACKEND): llamada a PUT /snapshots/{id} comentada.
    this.snapshots.update(arr => arr.map(s => s.id === id ? { ...s, ...data } : s));
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number, contribution?: number, tax?: number): Observable<MonthlySnapshot> {
    // TODO(BACKEND): llamada a POST /snapshots/upsert comentada. Solo se actualiza el estado local.
    const snapshot: MonthlySnapshot = {
      id: `${accountId}-${year}-${month}`,
      accountId,
      year,
      month,
      balance,
      income: incomeDelta,
      expenses: expenses ?? 0,
      contribution,
      tax,
      notes: undefined,
      checklistItems: undefined,
    };
    const existing = this.getSnapshot(accountId, year, month);
    if (existing) {
      this.snapshots.update(arr => arr.map(s => s.id === existing.id ? snapshot : s));
    } else {
      this.snapshots.update(arr => [...arr, snapshot]);
    }
    return of(snapshot);
  }

  toggleChecklistItem(snapshotId: string, itemId: string): void {
    this.snapshots.update(arr => arr.map(s => {
      if (s.id !== snapshotId || !s.checklistItems) { return s; }
      return {
        ...s,
        checklistItems: s.checklistItems.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };
    }));
  }

  deleteSnapshot(id: string): void {
    // TODO(BACKEND): llamada a DELETE /snapshots/{id} comentada.
    this.snapshots.update(arr => arr.filter(s => s.id !== id));
  }

  getAvailableMonths(): { year: number; month: number }[] {
    const unique = new Set<string>();
    const result: { year: number; month: number }[] = [];

    for (const s of this.snapshots()) {
      const key = `${s.year}-${s.month}`;
      if (!unique.has(key)) {
        unique.add(key);
        result.push({ year: s.year, month: s.month });
      }
    }

    return result.sort((a, b) => a.year - b.year || a.month - b.month);
  }
}
