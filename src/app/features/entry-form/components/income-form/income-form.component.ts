import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';
import { IncomeSource } from '../../../../models/income-source';

@Component({
  selector: 'app-income-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Añadir Ingreso</h3>

      <div class="flex flex-wrap gap-2">
        <input
          type="number" placeholder="Cantidad (€)" aria-label="Cantidad"
          class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          [(ngModel)]="amount"
        />

        <input
          type="text" placeholder="Note" aria-label="Note"
          class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          [(ngModel)]="note"
        />

        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          [disabled]="!amount()"
          (click)="save()"
        >Añadir Nomina</button>
      </div>

      @if (saved()) {
        <p class="mt-2 text-sm text-green-600">Ingreso añadido correctamente</p>
      }

      @if (incomes().length > 0) {
        <div class="mt-4 border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Ingresos registrados</p>
          <div class="space-y-1">
            @for (inc of incomes(); track inc.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="font-medium text-green-600 w-24">+{{ inc.amount.toLocaleString('es-ES') }} €</span>
                <span class="flex-1 text-gray-500 truncate">{{ inc.description }}</span>
                <button
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteIncome(inc)"
                  title="Eliminar ingreso"
                  aria-label="Eliminar ingreso"
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
    </div>
  `,
})
export class IncomeFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();
  readonly month = input.required<number>();
  readonly year = input.required<number>();

  private readonly ACCOUNT_ID = 'bbva-nomina';

  protected readonly snapshotId = computed(() => {
    return `${this.ACCOUNT_ID}-${this.year()}-${String(this.month()).padStart(2, '0')}`;
  });

  protected readonly incomes = computed<IncomeSource[]>(() => {
    const id = this.snapshotId();
    if (!id) { return []; }
    return this.service.getIncomesBySnapshot(id);
  });

  protected readonly amount = signal(0);
  protected readonly note = signal('');
  protected readonly saved = signal(false);

  protected save(): void {
    const y = this.year();
    const m = this.month();
    const snapshotId = this.snapshotId();

    this.service.createNomina({
      year: y,
      month: m,
      value: this.amount(),
      note: this.note(),
    }).subscribe(() => {
      this.amount.set(0);
      this.note.set('');
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }

  protected deleteIncome(inc: IncomeSource): void {
    this.service.deleteIncome(inc.id);
  }
}
