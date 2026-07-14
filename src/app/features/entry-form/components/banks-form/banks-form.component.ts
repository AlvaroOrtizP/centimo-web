import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';

@Component({
  selector: 'app-banks-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Selector mes/año -->
      <div class="flex gap-2">
        <select
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          [(ngModel)]="localMonth"
        >
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
        <select
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          [(ngModel)]="localYear"
        >
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
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
              [(ngModel)]="bbvaBalance"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en BBVA a 31 del mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#004481] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#003366] disabled:opacity-50"
            [disabled]="!bbvaBalance()"
            (click)="saveBBVA()"
          >Guardar</button>
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
              [(ngModel)]="caixaBalance"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en CaixaBank a 31 del mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-[#E65100] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#BF360C] disabled:opacity-50"
            [disabled]="!caixaBalance()"
            (click)="saveCaixa()"
          >Guardar</button>
          @if (savedCaixa()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial -->
      @if (history().length > 0) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Historial</p>
          <div class="space-y-1">
            @for (h of history(); track h.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="w-20 text-gray-500">{{ getMonthLabel(h.year, h.month) }}</span>
                <span class="font-semibold text-gray-900">{{ h.bbva.toLocaleString('es-ES') }} €</span>
                <span class="text-xs text-gray-400">BBVA</span>
                <span class="font-semibold text-gray-900">{{ h.caixa.toLocaleString('es-ES') }} €</span>
                <span class="text-xs text-gray-400">Caixa</span>
              </div>
            }
          </div>
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
  protected readonly localYear = signal(this.service.currentYear());

  protected readonly bbvaBalance = signal<number | null>(null);
  protected readonly savedBBVA = signal(false);

  protected readonly caixaBalance = signal<number | null>(null);
  protected readonly savedCaixa = signal(false);

  protected readonly previousBBVABalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.BBVA_ID);
    const current = snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
    return current?.balance ?? null;
  });

  protected readonly previousCaixaBalance = computed(() => {
    const snapshots = this.service.getSnapshotsByAccount(this.CAIXA_ID);
    const current = snapshots.find(s => s.year === this.localYear() && s.month === this.localMonth());
    return current?.balance ?? null;
  });

  protected readonly history = computed(() => {
    const bbvaSnaps = this.service.getSnapshotsByAccount(this.BBVA_ID);
    const caixaSnaps = this.service.getSnapshotsByAccount(this.CAIXA_ID);

    const allMonths = new Set<string>();
    bbvaSnaps.forEach(s => allMonths.add(`${s.year}-${s.month}`));
    caixaSnaps.forEach(s => allMonths.add(`${s.year}-${s.month}`));

    return Array.from(allMonths)
      .map(key => {
        const [y, m] = key.split('-').map(Number);
        const bbva = bbvaSnaps.find(s => s.year === y && s.month === m);
        const caixa = caixaSnaps.find(s => s.year === y && s.month === m);
        return {
          id: key,
          year: y,
          month: m,
          bbva: bbva?.balance ?? 0,
          caixa: caixa?.balance ?? 0,
        };
      })
      .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month));
  });

  constructor() {
    effect(() => {
      const snap = this.service.getSnapshot(this.BBVA_ID, this.localYear(), this.localMonth());
      this.bbvaBalance.set(snap?.balance ?? null);
    });

    effect(() => {
      const snap = this.service.getSnapshot(this.CAIXA_ID, this.localYear(), this.localMonth());
      this.caixaBalance.set(snap?.balance ?? null);
    });
  }

  protected saveBBVA(): void {
    const bal = this.bbvaBalance();
    if (bal === null) { return; }

    this.service.upsertSnapshot(this.BBVA_ID, this.localYear(), this.localMonth(), bal, 0);

    this.savedBBVA.set(true);
    setTimeout(() => this.savedBBVA.set(false), 2000);
  }

  protected saveCaixa(): void {
    const bal = this.caixaBalance();
    if (bal === null) { return; }

    this.service.upsertSnapshot(this.CAIXA_ID, this.localYear(), this.localMonth(), bal, 0);

    this.savedCaixa.set(true);
    setTimeout(() => this.savedCaixa.set(false), 2000);
  }
}
