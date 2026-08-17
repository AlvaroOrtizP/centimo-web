import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { SnapshotsService } from '../../api/generated/api/snapshots.service';
import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';
import { SnapshotUpsert } from '../../api/generated/model/snapshotUpsert';
import { MonthlySnapshotCreate } from '../../api/generated/model/monthlySnapshotCreate';
import { MonthlySnapshotUpdate } from '../../api/generated/model/monthlySnapshotUpdate';
import { MonthlySnapshot } from '../../models';
import { roundMoney } from '../utils/money.util';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class SnapshotsDataService {
  private readonly snapshotsApi = inject(SnapshotsService);
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
    this.snapshotsApi.listSnapshots().pipe(
      map(list => list.map(s => ({
        id: s.id,
        accountId: s.accountId,
        year: s.year,
        month: s.month,
        balance: roundMoney(s.balance ?? 0) ?? 0,
        income: roundMoney(s.income ?? 0) ?? 0,
        expenses: roundMoney(s.expenses ?? 0) ?? 0,
        contribution: s.contribution != null ? roundMoney(s.contribution) ?? undefined : undefined,
        tax: s.tax != null ? roundMoney(s.tax) ?? undefined : undefined,
        notes: s.notes ?? undefined,
        checklistItems: s.checklistItems ?? undefined,
      }))),
      catchError((err) => {
        this.logger.error('SnapshotsData', 'loadAllSnapshots error', err);
        return of([]);
      }),
    ).subscribe(snapshots => {
      this.snapshots.set(snapshots);
    });
  }

  /** Carga instantáneas desde el backend filtradas por año (y opcionalmente cuenta) y las fusiona. */
  loadSnapshotsByYear(year: number, accountId?: string): void {
    this.snapshotsApi.listSnapshots(year, accountId).pipe(
      map(list => list.map(s => ({
        id: s.id,
        accountId: s.accountId,
        year: s.year,
        month: s.month,
        balance: roundMoney(s.balance ?? 0) ?? 0,
        income: roundMoney(s.income ?? 0) ?? 0,
        expenses: roundMoney(s.expenses ?? 0) ?? 0,
        contribution: s.contribution != null ? roundMoney(s.contribution) ?? undefined : undefined,
        tax: s.tax != null ? roundMoney(s.tax) ?? undefined : undefined,
        notes: s.notes ?? undefined,
        checklistItems: s.checklistItems ?? undefined,
      }))),
      catchError((err) => {
        this.logger.error('SnapshotsData', 'loadSnapshotsByYear error', err);
        return of([]);
      }),
    ).subscribe(snapshots => {
      this.snapshots.update(current => {
        const others = accountId
          ? current.filter(s => !(s.year === year && s.accountId === accountId))
          : current.filter(s => s.year !== year);
        return [...others, ...snapshots];
      });
    });
  }


  addSnapshot(snapshot: MonthlySnapshot): void {
    const create: MonthlySnapshotCreate = {
      accountId: snapshot.accountId,
      year: snapshot.year,
      month: snapshot.month,
      balance: snapshot.balance,
      income: snapshot.income,
      expenses: snapshot.expenses,
      contribution: snapshot.contribution ?? null,
      tax: snapshot.tax ?? null,
      notes: snapshot.notes ?? null,
    };
    this.snapshotsApi.createSnapshot(create).subscribe(created => {
      this.snapshots.update(arr => [...arr, {
        id: created.id,
        accountId: created.accountId,
        year: created.year,
        month: created.month,
        balance: roundMoney(created.balance ?? 0) ?? 0,
        income: roundMoney(created.income ?? 0) ?? 0,
        expenses: roundMoney(created.expenses ?? 0) ?? 0,
        contribution: created.contribution != null ? roundMoney(created.contribution) ?? undefined : undefined,
        tax: created.tax != null ? roundMoney(created.tax) ?? undefined : undefined,
        notes: created.notes ?? undefined,
        checklistItems: created.checklistItems ?? undefined,
      }]);
    });
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    const update: MonthlySnapshotUpdate = {
      balance: data.balance,
      income: data.income,
      expenses: data.expenses,
      contribution: data.contribution ?? null,
      tax: data.tax ?? null,
      notes: data.notes ?? null,
    };
    this.snapshotsApi.updateSnapshot(id, update).subscribe(updated => {
      const snapshot: MonthlySnapshot = {
        id: updated.id,
        accountId: updated.accountId,
        year: updated.year,
        month: updated.month,
        balance: roundMoney(updated.balance ?? 0) ?? 0,
        income: roundMoney(updated.income ?? 0) ?? 0,
        expenses: roundMoney(updated.expenses ?? 0) ?? 0,
        contribution: updated.contribution != null ? roundMoney(updated.contribution) ?? undefined : undefined,
        tax: updated.tax != null ? roundMoney(updated.tax) ?? undefined : undefined,
        notes: updated.notes ?? undefined,
        checklistItems: updated.checklistItems ?? undefined,
      };
      this.snapshots.update(arr => arr.map(s => s.id === id ? snapshot : s));
    });
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number, contribution?: number, tax?: number): Observable<SnapshotResponse> {
    const body: SnapshotUpsert = {
      accountId,
      year,
      month,
      balance,
      incomeDelta,
      expenses,
      contribution,
      tax,
    };
    return this.snapshotsApi.upsertSnapshot(body).pipe(
      map(result => {
        const snapshot: MonthlySnapshot = {
          id: result.id,
          accountId: result.accountId,
          year: result.year,
          month: result.month,
          balance: roundMoney(result.balance ?? 0) ?? 0,
          income: roundMoney(result.income ?? 0) ?? 0,
          expenses: roundMoney(result.expenses ?? 0) ?? 0,
          contribution: result.contribution != null ? roundMoney(result.contribution) ?? undefined : undefined,
          tax: result.tax != null ? roundMoney(result.tax) ?? undefined : undefined,
          notes: result.notes ?? undefined,
          checklistItems: result.checklistItems ?? undefined,
        };
        const existing = this.getSnapshot(accountId, year, month);
        if (existing) {
          this.snapshots.update(arr => arr.map(s =>
            s.id === existing.id ? snapshot : s
          ));
        } else {
          this.snapshots.update(arr => [...arr, snapshot]);
        }
        return result;
      }),
    );
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
    this.snapshotsApi.deleteSnapshot(id).subscribe(() => {
      this.snapshots.update(arr => arr.filter(s => s.id !== id));
    });
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
