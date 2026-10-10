import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { RevolutBalance, RevolutBalanceSave } from '../../../../models';
import { RevolutHistoryTableComponent } from '../revolut-history-table/revolut-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-revolut-form',
  standalone: true,
  imports: [FormsModule, RevolutHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector mes -->
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          [ngModel]="localMonth()" (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
            <option [ngValue]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>

      <!-- Balance Revolut -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Revolut — Balance mensual</h3>

        @if (previousBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 5000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              [ngModel]="balance()"
              (ngModelChange)="balance.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Revolut a 31 del mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              [ngModel]="aporte()"
              (ngModelChange)="aporte.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Dinero total (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 15"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              [ngModel]="dineroTotal()"
              (ngModelChange)="onDineroTotalChange($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Intereses generados por Revolut</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-amber-600">Hacienda (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 2.85"
              class="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              [ngModel]="hacienda()"
              (ngModelChange)="onHaciendaChange($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">19% del total (auto, editable)</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Dinero final (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 12.15"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              [ngModel]="dineroFinal()"
              (ngModelChange)="dineroFinal.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Total menos Hacienda (auto, editable)</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-pink-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-pink-700 disabled:opacity-50"
            [disabled]="balance() == null"
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
        <app-revolut-history-table
          [balances]="history()"
          (edit)="onEdit($event)"
          (delete)="onDelete($event)"
        />
      </div>
    </div>
  `,
})
export class RevolutFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  protected readonly months = MONTH_OPTIONS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly editing = signal<RevolutBalance | null>(null);

  protected readonly balance = signal<number | null>(null);
  protected readonly aporte = signal<number | null>(null);
  protected readonly dineroTotal = signal<number | null>(null);
  protected readonly hacienda = signal<number | null>(null);
  protected readonly dineroFinal = signal<number | null>(null);
  protected readonly saved = signal(false);

  protected readonly previousBalance = computed(() => this.getPreviousBalance());

  protected readonly history = computed(() => {
    const since = RevolutFormComponent.toMes(this.localYear(), this.localMonth());
    return this.service.getRevolutBalances()
      .filter(b => b.mes <= since)
      .sort((a, b) => (a.mes < b.mes ? 1 : -1));
  });

  private static readonly HACIENDA_PERCENT = 19;
  private static readonly HACIENDA_RATE = 0.19;

  constructor() {
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();
      this.service.loadRevolutHistory(year, month);
      this.editing.set(null);
      this.resetFields();

      const balance = this.service.getRevolutBalance(year, month);
      if (balance) {
        this.editing.set(balance);
        this.balance.set(balance.balanceMensual);
        this.aporte.set(balance.aporteMensual ?? null);
        this.dineroTotal.set(balance.dineroTotal ?? null);
        this.hacienda.set(balance.dineroHacienda ?? null);
        this.dineroFinal.set(balance.dineroFinal ?? null);
      }
    }, { allowSignalWrites: true });
  }

  private getPreviousBalance(): number | null {
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    return this.service.getRevolutBalance(prevYear, prevMonth)?.balanceMensual ?? null;
  }

  private static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private static parseMes(mes: string): { year: number; month: number } {
    const [year, month] = mes.split('-').map(Number);
    return { year, month };
  }

  protected onDineroTotalChange(value: number | null): void {
    this.dineroTotal.set(value);
    this.hacienda.set(RevolutFormComponent.computeHacienda(value));
    this.dineroFinal.set(RevolutFormComponent.computeFinal(value, this.hacienda()));
  }

  protected onHaciendaChange(value: number | null): void {
    this.hacienda.set(value);
    this.dineroFinal.set(RevolutFormComponent.computeFinal(this.dineroTotal(), value));
  }

  private static computeHacienda(dineroTotal: number | null): number | null {
    if (dineroTotal == null) { return null; }
    return roundMoney(dineroTotal * RevolutFormComponent.HACIENDA_RATE) ?? null;
  }

  private static computeFinal(dineroTotal: number | null, hacienda: number | null): number | null {
    if (dineroTotal == null || hacienda == null) { return null; }
    return roundMoney(dineroTotal - hacienda) ?? null;
  }

  private resetFields(): void {
    this.balance.set(null);
    this.aporte.set(null);
    this.dineroTotal.set(null);
    this.hacienda.set(null);
    this.dineroFinal.set(null);
  }

  private fillFromBalance(balance: RevolutBalance): void {
    const { year, month } = RevolutFormComponent.parseMes(balance.mes);
    this.service.currentYear.set(year);
    this.localMonth.set(month);
    this.balance.set(balance.balanceMensual);
    this.aporte.set(balance.aporteMensual ?? null);
    this.dineroTotal.set(balance.dineroTotal ?? null);
    this.hacienda.set(balance.dineroHacienda ?? null);
    this.dineroFinal.set(balance.dineroFinal ?? null);
  }

  protected onEdit(balance: RevolutBalance): void {
    this.editing.set(balance);
    this.fillFromBalance(balance);
  }

  protected cancelEdit(): void {
    this.editing.set(null);
    this.resetFields();
  }

  protected onDelete(id: string): void {
    this.service.deleteRevolutBalance(id).subscribe();
  }

  protected save(): void {
    const bal = roundMoney(this.balance() ?? 0) ?? 0;
    if (bal === null) { return; }

    const data: RevolutBalanceSave = {
      balanceMensual: bal,
      aporteMensual: roundMoney(this.aporte() ?? 0) ?? 0,
      dineroTotal: roundMoney(this.dineroTotal() ?? 0) ?? 0,
      dineroHacienda: roundMoney(this.hacienda() ?? 0) ?? 0,
      dineroFinal: roundMoney(this.dineroFinal() ?? 0) ?? 0,
    };

    this.service.saveRevolutBalance(this.localYear(), this.localMonth(), data).subscribe({
      next: () => {
        this.cancelEdit();
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2000);
      },
    });
  }
}