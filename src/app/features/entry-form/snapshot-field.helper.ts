import { computed, signal, untracked, WritableSignal, Signal } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MonthlySnapshot } from '../../models/monthly-snapshot';

export type SnapshotFieldKey = 'balance' | 'income' | 'expenses' | 'contribution';

export interface SnapshotField {
  snapshot: Signal<MonthlySnapshot | undefined>;
  display: Signal<number | null>;
  userValue: WritableSignal<number | null>;
  hasUserValue: WritableSignal<boolean>;
}

export function createSnapshotField(
  service: FinancialDataService,
  accountId: string,
  year: () => number,
  month: () => number,
  field: SnapshotFieldKey = 'balance',
): SnapshotField {
  const userValue = signal<number | null>(null);
  const hasUserValue = signal(false);

  const snapshot = computed(() =>
    service.getSnapshotsByAccount(accountId)
      .find(s => s.year === year() && s.month === month())
  );

  const display = computed(() =>
    userValue() ?? snapshot()?.[field] ?? null
  );

  return { snapshot, display, userValue, hasUserValue };
}

export function resetSnapshotFields(...fields: SnapshotField[]): void {
  untracked(() => {
    fields.forEach(f => {
      f.userValue.set(null);
      f.hasUserValue.set(false);
    });
  });
}
