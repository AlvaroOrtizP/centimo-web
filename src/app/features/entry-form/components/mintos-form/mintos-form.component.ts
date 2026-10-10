import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { MintosBalance, MintosBalanceSave } from '../../../../models';
import { MintosHistoryTableComponent } from '../mintos-history-table/mintos-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-mintos-form',
  standalone: true,
  imports: [FormsModule, MintosHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector mes -->
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          [ngModel]="localMonth()" (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
            <option [ngValue]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>

      <!-- Balance Mintos -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Mintos — Balance mensual</h3>

        @if (previousBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Valor final de la cartera (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 5000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              [ngModel]="valorFinal()"
              (ngModelChange)="valorFinal.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor de la cartera Mintos al cerrar el mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Importe añadido este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 50"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              [ngModel]="importeAnadido()"
              (ngModelChange)="importeAnadido.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Importe añadido ese mes (el aporte extra; puede ser 0)</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:opacity-50"
            [disabled]="valorFinal() == null"
            (click)="save()"
          >{{ editing() ? 'Actualizar balance' : 'Guardar' }}</button>
          @if (editing()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEdit()"
            >Cancelar</button>
          }
          @if (saved()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial -->
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial</p>
        <app-mintos-history-table
          [balances]="history()"
          (edit)="onEdit($event)"
          (delete)="onDelete($event)"
        />
      </div>
    </div>
  `,
})
export class MintosFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  protected readonly months = MONTH_OPTIONS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly editing = signal<MintosBalance | null>(null);

  protected readonly valorFinal = signal<number | null>(null);
  protected readonly importeAnadido = signal<number | null>(null);
  protected readonly saved = signal(false);

  protected readonly previousBalance = computed(() => this.getPreviousBalance());

  protected readonly history = computed(() => {
    const since = MintosFormComponent.toMes(this.localYear(), this.localMonth());
    return this.service.getMintosBalances()
      .filter(b => b.mes <= since)
      .sort((a, b) => (a.mes < b.mes ? 1 : -1));
  });

  constructor() {
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();
      this.service.loadMintosHistory(year, month);
      this.editing.set(null);
      this.resetFields();

      const balance = this.service.getMintosBalance(year, month);
      if (balance) {
        this.editing.set(balance);
        this.valorFinal.set(balance.valorFinal);
        this.importeAnadido.set(balance.importeAnadido);
      }
    }, { allowSignalWrites: true });
  }

  private getPreviousBalance(): number | null {
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    return this.service.getMintosBalance(prevYear, prevMonth)?.valorFinal ?? null;
  }

  private static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private static parseMes(mes: string): { year: number; month: number } {
    const [year, month] = mes.split('-').map(Number);
    return { year, month };
  }

  private resetFields(): void {
    this.valorFinal.set(null);
    this.importeAnadido.set(null);
  }

  private fillFromBalance(balance: MintosBalance): void {
    const { year, month } = MintosFormComponent.parseMes(balance.mes);
    this.service.currentYear.set(year);
    this.localMonth.set(month);
    this.valorFinal.set(balance.valorFinal);
    this.importeAnadido.set(balance.importeAnadido);
  }

  protected onEdit(balance: MintosBalance): void {
    this.editing.set(balance);
    this.fillFromBalance(balance);
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.resetFields();
  }

  protected onDelete(id: string): void {
    this.service.deleteMintosBalance(id).subscribe();
  }

  protected save(): void {
    const valor = roundMoney(this.valorFinal() ?? 0) ?? 0;
    if (valor === null) { return; }

    const data: MintosBalanceSave = {
      importeAnadido: roundMoney(this.importeAnadido() ?? 0) ?? 0,
      valorFinal: valor,
    };

    this.service.saveMintosBalance(this.localYear(), this.localMonth(), data).subscribe({
      next: () => {
        this.cancelEdit();
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
    });
  }
}