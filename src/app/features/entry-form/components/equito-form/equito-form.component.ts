import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS } from '../../../../core/constants/date.constants';
import { CrowdlendingInvestment } from '../../../../models/crowdlending-investment';
import { ProjectStatus } from '../../../../models/project-status';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { SnapshotHistoryTableComponent } from '../snapshot-history-table/snapshot-history-table.component';

@Component({
  selector: 'app-equito-form',
  standalone: true,
  imports: [FormsModule, SnapshotHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Registrar inversión -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900">{{ editingInvestment() ? 'Editar inversión' : 'Registrar inversión' }}</h3>
          @if (editingInvestment()) {
            <button
              class="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditInvestment()"
            >Cancelar edición</button>
          }
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div class="sm:col-span-2 lg:col-span-1">
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Nombre del proyecto</label>
            <input
              type="text" placeholder="ej: Préstamo personal Letonia"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="projectName"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Cantidad invertida (€)</label>
            <input
              type="number" step="any" placeholder="ej: 1000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="investedAmount"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Tasa de interés (%)</label>
            <input
              type="number" step="any" placeholder="ej: 8.5"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="interestRate"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fecha de inicio</label>
            <input
              type="date"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="startDate"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fecha de fin <span class="normal-case text-gray-400">(opcional)</span></label>
            <input
              type="date"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="endDate"
            />
          </div>
        </div>

        @if (investedAmount() > 0 && interestRate() > 0) {
          <div class="mt-3 rounded-lg bg-orange-50 px-4 py-2 text-sm text-orange-800">
            Retorno mensual estimado: <strong>{{ monthlyReturnEstimate().toLocaleString('es-ES') }} €</strong>
            <span class="text-orange-500"> ({{ investedAmount() }} × {{ interestRate() }}% / 12)</span>
          </div>
        }

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            [disabled]="!canSave()"
            (click)="saveInvestment()"
          >{{ editingInvestment() ? 'Actualizar inversión' : 'Registrar inversión' }}</button>
          @if (editingInvestment()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditInvestment()"
            >Cancelar</button>
          }
          @if (savedInvestment()) {
            <span class="text-sm text-emerald-600">✓ Inversión registrada</span>
          }
        </div>
      </div>

      <!-- Inversiones registradas -->
      @if (investments().length > 0) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Inversiones registradas</p>
          <div class="space-y-1">
            @for (inv of investments(); track inv.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <div class="h-2 w-2 rounded-full" [class.bg-emerald-500]="inv.status === 'active'" [class.bg-blue-500]="inv.status === 'completed'" [class.bg-red-500]="inv.status === 'defaulted'"></div>
                <span class="w-40 font-semibold text-gray-900 truncate">{{ inv.projectName }}</span>
                <span class="text-gray-500">{{ inv.investedAmount.toLocaleString('es-ES') }} €</span>
                <span class="text-gray-400">{{ inv.interestRate }}%</span>
                <span class="text-gray-400">{{ inv.termMonths }}m</span>
                <span class="text-gray-400">{{ inv.startDate }}</span>
                <span class="ml-auto text-emerald-600 font-medium">+{{ inv.totalReturned.toLocaleString('es-ES') }} €</span>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-orange-50 hover:text-orange-500"
                  (click)="onEditInvestment(inv)"
                  title="Editar inversión"
                  aria-label="Editar inversión"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                </button>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteInvestment(inv)"
                  title="Eliminar inversión"
                  aria-label="Eliminar inversión"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Balance mensual -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Equito — Balance mensual</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            [(ngModel)]="localMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            aria-label="Año"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
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

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 2500"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="balance"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Equito a 31 del mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Intereses obtenidos este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 15"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="income"
            />
            <p class="mt-0.5 text-xs text-gray-400">Intereses o rendimientos obtenidos</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="contribution"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Retirada este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 50"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              [(ngModel)]="withdrawal"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad retirada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-orange-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
            [disabled]="!balance()"
            (click)="saveBalance()"
          >{{ editingSnapshot() ? 'Actualizar balance' : 'Guardar balance' }}</button>
          @if (editingSnapshot()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEdit()"
            >Cancelar</button>
          }
          @if (savedBalance()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <app-snapshot-history-table
        [snapshots]="balanceHistory()"
        (edit)="onEdit($event)"
        (delete)="onDelete($event)"
      />
    </div>
  `,
})
export class EquitoFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  private readonly PLATFORM_ID = 'equito';

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;

  // --- Inversiones ---
  protected readonly projectName = signal('');
  protected readonly investedAmount = signal(0);
  protected readonly interestRate = signal(0);
  protected readonly startDate = signal('');
  protected readonly endDate = signal('');
  protected readonly savedInvestment = signal(false);
  protected readonly editingInvestment = signal<CrowdlendingInvestment | null>(null);

  protected readonly investments = computed(() =>
    this.service.getCrowdlendingByPlatform(this.PLATFORM_ID)
  );

  protected readonly monthlyReturnEstimate = computed(() => {
    const amount = this.investedAmount();
    const rate = this.interestRate();
    if (amount <= 0 || rate <= 0) { return 0; }
    return Math.round((amount * rate / 100 / 12) * 100) / 100;
  });

  protected readonly canSave = computed(() =>
    this.projectName().trim().length > 0 &&
    this.investedAmount() > 0 &&
    this.interestRate() > 0 &&
    this.startDate().trim().length > 0
  );

  // --- Balance mensual ---
  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = signal(this.service.currentYear());
  protected readonly balance = signal<number | null>(null);
  protected readonly income = signal<number | null>(null);
  protected readonly contribution = signal<number | null>(null);
  protected readonly withdrawal = signal<number | null>(null);
  protected readonly savedBalance = signal(false);
  protected readonly editingSnapshot = signal<MonthlySnapshot | null>(null);

  private readonly accountId = computed(() => {
    const accs = this.accounts();
    return accs.find(a => a.platformId === this.PLATFORM_ID)?.id ?? '';
  });

  protected readonly snapshotId = computed(() =>
    `${this.accountId()}-${this.localYear()}-${String(this.localMonth()).padStart(2, '0')}`
  );

  protected readonly previousBalance = computed(() => {
    const accId = this.accountId();
    if (!accId) { return null; }
    const snapshots = this.service.getSnapshotsByAccount(accId);
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    const prev = snapshots.find(s => s.year === prevYear && s.month === prevMonth);
    return prev?.balance ?? null;
  });

  protected readonly balanceHistory = computed(() => {
    const accId = this.accountId();
    if (!accId) { return []; }
    return this.service.getSnapshotsByAccount(accId)
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
  });

  constructor() {
    effect(() => {
      this.service.snapshots();
      const accId = this.accountId();
      if (!accId) { return; }
      const snap = this.service.getSnapshot(accId, this.localYear(), this.localMonth());
      if (this.editingSnapshot()) { return; }
      this.balance.set(snap?.balance ?? null);
      this.income.set(snap?.income ?? null);
      this.contribution.set(snap?.contribution ?? null);
      this.withdrawal.set(snap?.expenses && snap.expenses > 0 ? snap.expenses : null);
    }, { allowSignalWrites: true });
  }

  // --- Inversiones ---
  protected onEditInvestment(inv: CrowdlendingInvestment): void {
    this.editingInvestment.set(inv);
    this.projectName.set(inv.projectName);
    this.investedAmount.set(inv.investedAmount);
    this.interestRate.set(inv.interestRate);
    this.startDate.set(inv.startDate);
    this.endDate.set(inv.endDate ?? '');
  }

  protected cancelEditInvestment(): void {
    this.editingInvestment.set(null);
    this.projectName.set('');
    this.investedAmount.set(0);
    this.interestRate.set(0);
    this.startDate.set('');
    this.endDate.set('');
  }

  protected saveInvestment(): void {
    const amount = this.investedAmount();
    const rate = this.interestRate();
    const monthlyReturn = Math.round((amount * rate / 100 / 12) * 100) / 100;

    const editing = this.editingInvestment();
    const payload: CrowdlendingInvestment = {
      id: editing?.id ?? `cl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platformId: this.PLATFORM_ID,
      projectName: this.projectName(),
      investedAmount: amount,
      interestRate: rate,
      termMonths: editing?.termMonths ?? 0,
      startDate: this.startDate(),
      endDate: this.endDate() || undefined,
      monthlyReturn,
      totalReturned: editing?.totalReturned ?? 0,
      status: editing?.status ?? ProjectStatus.Active,
    };

    const request = editing
      ? this.service.updateCrowdlendingInvestment(editing.id, payload)
      : this.service.addCrowdlendingInvestment(payload);

    request.subscribe(() => {
      this.cancelEditInvestment();
      this.savedInvestment.set(true);
      setTimeout(() => this.savedInvestment.set(false), 2000);
    });
  }

  protected deleteInvestment(inv: CrowdlendingInvestment): void {
    this.service.deleteCrowdlendingInvestment(inv.id).subscribe();
  }

  // --- Balance mensual ---
  protected onEdit(snap: MonthlySnapshot): void {
    this.localMonth.set(snap.month);
    this.localYear.set(snap.year);
    this.balance.set(snap.balance);
    this.income.set(snap.income ?? null);
    this.contribution.set(snap.contribution ?? null);
    this.withdrawal.set(snap.expenses && snap.expenses > 0 ? snap.expenses : null);
    this.editingSnapshot.set(snap);
  }

  protected cancelEdit(): void {
    this.editingSnapshot.set(null);
    this.income.set(null);
    this.contribution.set(null);
    this.withdrawal.set(null);
  }

  protected onDelete(id: string): void {
    this.service.deleteSnapshot(id);
    if (this.editingSnapshot()?.id === id) {
      this.cancelEdit();
    }
  }

  protected saveBalance(): void {
    const bal = this.balance();
    if (bal === null) { return; }

    const accId = this.accountId();
    if (!accId) { return; }

    const inc = this.income() ?? 0;
    const contrib = this.contribution() ?? 0;
    const withdrawal = this.withdrawal() ?? 0;

    const editing = this.editingSnapshot();
    if (editing) {
      this.service.updateSnapshot(editing.id, {
        balance: bal,
        income: inc,
        contribution: contrib,
        expenses: withdrawal,
      });
      this.cancelEdit();
    } else {
      this.service.upsertSnapshot(accId, this.localYear(), this.localMonth(), bal, inc, withdrawal, contrib).subscribe();
    }

    this.income.set(null);
    this.contribution.set(null);
    this.withdrawal.set(null);
    this.savedBalance.set(true);
    setTimeout(() => this.savedBalance.set(false), 2000);
  }
}
