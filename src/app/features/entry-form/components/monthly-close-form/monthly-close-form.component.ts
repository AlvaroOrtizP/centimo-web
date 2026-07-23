import { Component, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';

interface AccountForm {
  accountId: string;
  accountName: string;
  contribution: number;
  balance: number;
}

@Component({
  selector: 'app-monthly-close-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900">Cierre Mensual</h3>
        <button
          class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          (click)="saveAll()"
        >Guardar Cierre</button>
      </div>

      @if (saved()) {
        <div class="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          ✓ Cierre guardado correctamente
        </div>
      }

      <div class="space-y-3">
        @for (form of forms(); track form.accountId) {
          <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div class="flex flex-wrap items-end gap-3">
              <div class="flex-1 min-w-[160px]">
                <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">
                  {{ form.accountName }}
                </label>
                <div class="mt-1.5 flex items-center gap-2 text-sm text-gray-400">
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                    @if (existingSnapshot(form.accountId); as snap) {
                      Mes ant. {{ snap.balance.toLocaleString('es-ES') }} €
                    } @else {
                      Sin datos previos
                    }
                  </span>
                </div>
              </div>
              <div class="w-36">
                <label class="block text-xs font-medium uppercase tracking-wider text-gray-400">Aportación (€)</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  [(ngModel)]="form.contribution"
                />
              </div>
              <div class="w-36">
                <label class="block text-xs font-medium uppercase tracking-wider text-gray-400">Valor cierre (€)</label>
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  [(ngModel)]="form.balance"
                />
              </div>
            </div>
          </div>
        } @empty {
          <div class="flex flex-col items-center gap-2 py-12 text-sm text-gray-400">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
              <rect width="18" height="14" x="3" y="3" rx="2"/><line x1="3" x2="21" y1="10" y2="10"/>
            </svg>
            No hay cuentas en esta plataforma
          </div>
        }
      </div>
    </div>
  `,
})
export class MonthlyCloseFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected readonly saved = signal(false);
  protected readonly forms = signal<AccountForm[]>([]);

  constructor() {
    effect(() => {
      const snapshots = this.service.snapshots();
      const accs = this.accounts();
      const y = this.year();
      const m = this.month();
      this.forms.set(accs.map(acc => {
        const snap = snapshots.find(s => s.accountId === acc.id && s.year === y && s.month === m);
        return {
          accountId: acc.id,
          accountName: acc.name,
          contribution: snap?.contribution ?? 0,
          balance: snap?.balance ?? 0,
        };
      }));
    });
  }

  protected existingSnapshot(accountId: string) {
    const y = this.year();
    const m = this.month();
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    return this.service.getSnapshot(accountId, prevYear, prevMonth);
  }

  protected saveAll(): void {
    const y = this.year();
    const m = this.month();

    for (const form of this.forms()) {
      const existing = this.service.getSnapshot(form.accountId, y, m);
      const snapshotId = `${form.accountId}-${y}-${String(m).padStart(2, '0')}`;

      if (existing) {
        this.service.updateSnapshot(existing.id, {
          balance: form.balance,
          contribution: form.contribution,
        });
      } else {
        this.service.addSnapshot({
          id: snapshotId,
          accountId: form.accountId,
          year: y,
          month: m,
          balance: form.balance,
          income: 0,
          expenses: 0,
          contribution: form.contribution,
        });
      }
    }

    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
