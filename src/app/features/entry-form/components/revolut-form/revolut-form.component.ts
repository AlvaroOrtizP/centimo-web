import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';

@Component({
  selector: 'app-revolut-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Revolut — Balance mensual</h3>

      <div class="mb-4 flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          [(ngModel)]="localMonth"
        >
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
        <select
          aria-label="Año"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          [(ngModel)]="localYear"
        >
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>
      </div>

      @if (previousBalance() !== null) {
        <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
          Balance mes anterior: <strong>{{ previousBalance()!.toLocaleString('es-ES') }} €</strong>
        </div>
      }

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 5000"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [ngModel]="displayBalance()"
            (ngModelChange)="userBalance.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Valor total en Revolut a 31 del mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses cuenta remunerada (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 15"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [ngModel]="displayInterest()"
            (ngModelChange)="userInterest.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Intereses obtenidos este mes</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">TAE (%)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 2.5"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            [(ngModel)]="tae"
          />
          <p class="mt-0.5 text-xs text-gray-400">Opcional — referencia</p>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <button
          class="rounded-lg bg-pink-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
          [disabled]="!displayBalance()"
          (click)="save()"
        >{{ hasExistingSnapshot() ? 'Editar balance' : 'Guardar balance' }}</button>
        @if (saved()) {
          <span class="text-sm text-emerald-600">✓ Guardado</span>
        }
      </div>
    </div>

    @if (history().length > 0) {
      <div class="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Historial de balances</p>
        <div class="space-y-1">
          @for (h of history(); track h.id) {
            <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
              <span class="w-20 text-gray-500">{{ getMonthLabel(h.year, h.month) }}</span>
              <span class="font-semibold text-gray-900">{{ h.balance.toLocaleString('es-ES') }} €</span>
              @if (h.income > 0) {
                <span class="text-xs text-pink-600">+{{ h.income.toLocaleString('es-ES') }} € intereses</span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class RevolutFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly ACCOUNT_ID = 'revolut-main';
  private readonly B100_SAVINGS_ID = 'b100-save';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = signal(this.service.currentYear());
  protected readonly tae = signal<number | null>(null);
  protected readonly saved = signal(false);

  protected readonly userBalance = signal<number | null>(null);
  protected readonly userInterest = signal<number | null>(null);

  private readonly currentSnapshot = computed<MonthlySnapshot | undefined>(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.ACCOUNT_ID);
    return snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
  });

  private readonly currentB100Snapshot = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.B100_SAVINGS_ID);
    return snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
  });

  protected readonly displayBalance = computed(() =>
    this.userBalance() ?? this.currentSnapshot()?.balance ?? this.currentB100Snapshot()?.balance ?? null
  );

  protected readonly displayInterest = computed(() =>
    this.userInterest() ?? this.currentSnapshot()?.income ?? null
  );

  protected readonly snapshotId = computed(() =>
    `${this.ACCOUNT_ID}-${this.localYear()}-${String(this.localMonth()).padStart(2, '0')}`
  );

  protected readonly previousBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.ACCOUNT_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly hasExistingSnapshot = computed(() =>
    this.service.getSnapshotsByAccount(this.ACCOUNT_ID)
      .some(s => s.year === this.localYear() && s.month === this.localMonth())
  );

  protected readonly history = computed(() =>
    this.service.getSnapshotsByAccount(this.ACCOUNT_ID)
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
  );

  constructor() {
    effect(() => {
      this.localYear();
      this.localMonth();
      untracked(() => {
        this.userBalance.set(null);
        this.userInterest.set(null);
      });
    });
  }

  protected save(): void {
    const bal = this.displayBalance();
    if (bal === null) { return; }

    const inter = this.displayInterest() ?? 0;
    this.service.upsertSnapshot(this.ACCOUNT_ID, this.localYear(), this.localMonth(), bal, inter).subscribe();

    this.userInterest.set(null);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
