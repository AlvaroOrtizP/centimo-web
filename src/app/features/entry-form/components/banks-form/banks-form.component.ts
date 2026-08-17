import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { createSnapshotField, resetSnapshotFields } from '../../snapshot-field.helper';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-banks-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector mes/año -->
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          [ngModel]="localMonth"
          (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>

      <!-- BBVA -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">BBVA — Cuenta Nómina</h3>

        @if (previousBBVABalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousBBVABalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 4000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-800"
              [ngModel]="bbvaBalance.display()"
              (ngModelChange)="bbvaBalance.userValue.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en BBVA a 31 del mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#004481] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003366] disabled:opacity-50"
            [disabled]="!bbvaBalance.display()"
            (click)="saveBBVA()"
          >{{ editingBBVA() ? 'Actualizar balance' : (hasExistingBBVA() ? 'Editar balance' : 'Guardar') }}</button>
          @if (editingBBVA()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditBBVA()"
            >Cancelar</button>
          }
          @if (savedBBVA()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- CaixaBank -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">CaixaBank — Cuenta alternativa</h3>

        @if (previousCaixaBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousCaixaBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 3000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-600"
              [ngModel]="caixaBalance.display()"
              (ngModelChange)="caixaBalance.userValue.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en CaixaBank a 31 del mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#E65100] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#BF360C] disabled:opacity-50"
            [disabled]="!caixaBalance.display()"
            (click)="saveCaixa()"
          >{{ editingCaixa() ? 'Actualizar balance' : (hasExistingCaixa() ? 'Editar balance' : 'Guardar') }}</button>
          @if (editingCaixa()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditCaixa()"
            >Cancelar</button>
          }
          @if (savedCaixa()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial BBVA -->
      @if (historyBBVA().length > 0) {
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial BBVA</p>
          <app-snapshot-history-table
            [snapshots]="historyBBVA()"
            (edit)="onEditBBVA($event)"
            (delete)="onDeleteBBVA($event)"
          />
        </div>
      }

      <!-- Historial CaixaBank -->
      @if (historyCaixa().length > 0) {
        <div>
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial CaixaBank</p>
          <app-snapshot-history-table
            [snapshots]="historyCaixa()"
            (edit)="onEditCaixa($event)"
            (delete)="onDeleteCaixa($event)"
          />
        </div>
      }
    </div>
  `,
})
export class BanksFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly BBVA_ID = 'bbva-checking';
  private readonly CAIXA_ID = 'caixa-main';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly editingBBVA = signal<MonthlySnapshot | null>(null);
  protected readonly editingCaixa = signal<MonthlySnapshot | null>(null);

  protected readonly bbvaBalance = createSnapshotField(this.service, this.BBVA_ID, () => this.localYear(), () => this.localMonth());
  protected readonly savedBBVA = signal(false);

  protected readonly caixaBalance = createSnapshotField(this.service, this.CAIXA_ID, () => this.localYear(), () => this.localMonth());
  protected readonly savedCaixa = signal(false);

  protected readonly previousBBVABalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.BBVA_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly previousCaixaBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.CAIXA_ID);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly hasExistingBBVA = computed(() =>
    this.service.getSnapshotsByAccount(this.BBVA_ID)
      .some(s => s.year === this.localYear() && s.month === this.localMonth())
  );

  protected readonly hasExistingCaixa = computed(() =>
    this.service.getSnapshotsByAccount(this.CAIXA_ID)
      .some(s => s.year === this.localYear() && s.month === this.localMonth())
  );

  protected readonly historyBBVA = computed(() =>
    this.service.getSnapshotsByAccount(this.BBVA_ID)
      .filter(s => s.year === this.localYear())
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + b.month))
  );

  protected readonly historyCaixa = computed(() =>
    this.service.getSnapshotsByAccount(this.CAIXA_ID)
      .filter(s => s.year === this.localYear())
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + b.month))
  );

  constructor() {
    effect(() => {
      this.localYear();
      this.localMonth();
      this.editingBBVA.set(null);
      this.editingCaixa.set(null);
      resetSnapshotFields(this.bbvaBalance, this.caixaBalance);
    }, { allowSignalWrites: true });
  }

  protected onEditBBVA(snap: MonthlySnapshot): void {
    this.editingBBVA.set(snap);
    this.service.currentYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.bbvaBalance.userValue.set(snap.balance);
    this.bbvaBalance.hasUserValue.set(true);
  }

  protected cancelEditBBVA(): void {
    this.editingBBVA.set(null);
    this.bbvaBalance.userValue.set(null);
    this.bbvaBalance.hasUserValue.set(false);
  }

  protected onDeleteBBVA(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected onEditCaixa(snap: MonthlySnapshot): void {
    this.editingCaixa.set(snap);
    this.service.currentYear.set(snap.year);
    this.localMonth.set(snap.month);
    this.caixaBalance.userValue.set(snap.balance);
    this.caixaBalance.hasUserValue.set(true);
  }

  protected cancelEditCaixa(): void {
    this.editingCaixa.set(null);
    this.caixaBalance.userValue.set(null);
    this.caixaBalance.hasUserValue.set(false);
  }

  protected onDeleteCaixa(id: string): void {
    this.service.deleteSnapshot(id);
  }

  protected saveBBVA(): void {
    const bal = roundMoney(this.bbvaBalance.display());
    if (bal === null) { return; }

    const existing = this.editingBBVA();
    if (existing) {
      this.service.updateSnapshot(existing.id, { balance: bal });
      this.cancelEditBBVA();
    } else {
      this.service.upsertSnapshot(this.BBVA_ID, this.localYear(), this.localMonth(), bal, 0).subscribe();
    }

    this.savedBBVA.set(true);
    setTimeout(() => this.savedBBVA.set(false), 2000);
  }

  protected saveCaixa(): void {
    const bal = roundMoney(this.caixaBalance.display());
    if (bal === null) { return; }

    const existing = this.editingCaixa();
    if (existing) {
      this.service.updateSnapshot(existing.id, { balance: bal });
      this.cancelEditCaixa();
    } else {
      this.service.upsertSnapshot(this.CAIXA_ID, this.localYear(), this.localMonth(), bal, 0).subscribe();
    }

    this.savedCaixa.set(true);
    setTimeout(() => this.savedCaixa.set(false), 2000);
  }
}
