import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

import { SnapshotsService } from '../../api/generated/api/snapshots.service';
import { SnapshotResponse } from '../../api/generated/model/snapshotResponse';
import { SnapshotUpsert } from '../../api/generated/model/snapshotUpsert';
import { MonthlySnapshotCreate } from '../../api/generated/model/monthlySnapshotCreate';
import { MonthlySnapshot } from '../../models';
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
    return this.snapshots().filter(s => s.year === year && s.month === month);
  }

  getSnapshot(accountId: string, year: number, month: number): MonthlySnapshot | undefined {
    return this.snapshots().find(s => s.accountId === accountId && s.year === year && s.month === month);
  }

  fetchSnapshotFromBackend(accountId: string, year: number, month: number): Observable<SnapshotResponse | null> {
    return this.snapshotsApi.getSnapshotByAccountAndDate(accountId, year, month).pipe(
      map(response => response as SnapshotResponse),
      catchError((error: HttpErrorResponse) => {
        return error.status === 404 ? of(null) : of(null);
      }),
    );
  }

  loadAllSnapshots(): void {
    this.snapshotsApi.listSnapshots().pipe(
      map(list => list.map(s => ({
        id: s.id,
        accountId: s.accountId,
        year: s.year,
        month: s.month,
        balance: s.balance,
        income: s.income,
        expenses: s.expenses,
        contribution: s.contribution ?? undefined,
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

  addSnapshot(snapshot: MonthlySnapshot): void {
    const create: MonthlySnapshotCreate = {
      accountId: snapshot.accountId,
      year: snapshot.year,
      month: snapshot.month,
      balance: snapshot.balance,
      income: snapshot.income,
      expenses: snapshot.expenses,
      contribution: snapshot.contribution ?? null,
      notes: snapshot.notes ?? null,
    };
    this.snapshotsApi.createSnapshot(create).subscribe(created => {
      this.snapshots.update(arr => [...arr, {
        id: created.id,
        accountId: created.accountId,
        year: created.year,
        month: created.month,
        balance: created.balance,
        income: created.income,
        expenses: created.expenses,
        contribution: created.contribution ?? undefined,
        notes: created.notes ?? undefined,
        checklistItems: created.checklistItems ?? undefined,
      }]);
    });
  }

  updateSnapshot(id: string, data: Partial<MonthlySnapshot>): void {
    this.snapshots.update(arr => arr.map(s => s.id === id ? { ...s, ...data } : s));
  }

  upsertSnapshot(accountId: string, year: number, month: number, balance: number, incomeDelta: number, expenses?: number, contribution?: number): Observable<SnapshotResponse> {
    const body: SnapshotUpsert = {
      accountId,
      year,
      month,
      balance,
      incomeDelta,
      expenses,
      contribution,
    };
    return this.snapshotsApi.upsertSnapshot(body).pipe(
      map(result => {
        const snapshot: MonthlySnapshot = {
          id: result.id,
          accountId: result.accountId,
          year: result.year,
          month: result.month,
          balance: result.balance,
          income: result.income,
          expenses: result.expenses,
          contribution: result.contribution ?? undefined,
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
