import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS, getMonthLabel } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { B100Balance, B100BalanceSave, B100Subcuenta } from '../../../../models';
import { B100HistoryTableComponent } from '../b100-history-table/b100-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-b100-form',
  standalone: true,
  imports: [FormsModule, B100HistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector mes -->
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          [ngModel]="localMonth()" (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
            <option [ngValue]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>

      <!-- Cuenta Save -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">B100 — Cuenta Save</h3>

        @if (previousSavingsBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousSavingsBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 3000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsBalance()"
              (ngModelChange)="savingsBalance.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Cuenta Save</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Dinero total a repartir (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 12"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsTotalRepartir()"
              (ngModelChange)="onTotalRepartirSavings($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Total que reparte B100 al 100%</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-amber-600">Hacienda (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 2.28"
              class="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              [ngModel]="savingsHacienda()"
              (ngModelChange)="savingsHacienda.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">19% de lo repartido (auto, editable)</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="savingsAporte()"
              (ngModelChange)="savingsAporte.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="savingsBalance() == null"
            (click)="saveSavings()"
          >{{ editingSavings() ? 'Actualizar balance' : 'Guardar' }}</button>
          @if (editingSavings()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditSavings()"
            >Cancelar</button>
          }
          @if (savedSavings()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Cuenta Health -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">B100 — Cuenta Health</h3>

        @if (previousInvestmentBalance() !== null) {
          <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Balance mes anterior: <strong>{{ previousInvestmentBalance()!.toLocaleString('es-ES') }} €</strong>
          </div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 5000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentBalance()"
              (ngModelChange)="investmentBalance.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Cuenta Health</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Dinero total a repartir (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 20"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentTotalRepartir()"
              (ngModelChange)="onTotalRepartirInvestment($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Total que reparte B100 al 100%</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-amber-600">Hacienda (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 3.80"
              class="mt-1 w-full rounded-lg border border-amber-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              [ngModel]="investmentHacienda()"
              (ngModelChange)="investmentHacienda.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">19% de lo repartido (auto, editable)</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 200"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              [ngModel]="investmentAporte()"
              (ngModelChange)="investmentAporte.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Cantidad ingresada este mes</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            [disabled]="investmentBalance() == null"
            (click)="saveInvestment()"
          >{{ editingInvestment() ? 'Actualizar balance' : 'Guardar' }}</button>
          @if (editingInvestment()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditInvestment()"
            >Cancelar</button>
          }
          @if (savedInvestment()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial Save -->
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial Save</p>
        <app-b100-history-table
          [balances]="historySavings()"
          (edit)="onEdit($event)"
          (delete)="onDelete($event)"
        />
      </div>

      <!-- Historial Health -->
      <div>
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Historial Health</p>
        <app-b100-history-table
          [balances]="historyInvestment()"
          (edit)="onEditInvestment($event)"
          (delete)="onDeleteInvestment($event)"
        />
      </div>
    </div>
  `,
})
export class B100FormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  protected readonly SAVINGS_TIPO: B100Subcuenta = 'save';
  protected readonly INVESTMENT_TIPO: B100Subcuenta = 'health';

  protected readonly months = MONTH_OPTIONS;
  protected readonly getMonthLabel = getMonthLabel;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly editingSavings = signal<B100Balance | null>(null);
  protected readonly editingInvestment = signal<B100Balance | null>(null);

  protected readonly savingsBalance = signal<number | null>(null);
  protected readonly savingsTotalRepartir = signal<number | null>(null);
  protected readonly savingsHacienda = signal<number | null>(null);
  protected readonly savingsAporte = signal<number | null>(null);
  protected readonly savedSavings = signal(false);

  protected readonly investmentBalance = signal<number | null>(null);
  protected readonly investmentTotalRepartir = signal<number | null>(null);
  protected readonly investmentHacienda = signal<number | null>(null);
  protected readonly investmentAporte = signal<number | null>(null);
  protected readonly savedInvestment = signal(false);

  protected readonly previousSavingsBalance = computed(() => this.getPreviousBalance(this.SAVINGS_TIPO));
  protected readonly previousInvestmentBalance = computed(() => this.getPreviousBalance(this.INVESTMENT_TIPO));

  protected readonly historySavings = computed(() => this.getHistory(this.SAVINGS_TIPO));
  protected readonly historyInvestment = computed(() => this.getHistory(this.INVESTMENT_TIPO));

  private static readonly HACIENDA_PERCENT = 19;
  private static readonly HACIENDA_RATE = 0.19;

  private getPreviousBalance(tipo: B100Subcuenta): number | null {
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    return this.service.getB100Balance(tipo, prevYear, prevMonth)?.balanceMensual ?? null;
  }

  private getHistory(tipo: B100Subcuenta): B100Balance[] {
    const since = B100FormComponent.toMes(this.localYear(), this.localMonth());
    return this.service.getB100BalancesByTipo(tipo)
      .filter(b => b.mes <= since)
      .sort((a, b) => (a.mes < b.mes ? 1 : -1));
  }

  private static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private static parseMes(mes: string): { year: number; month: number } {
    const [year, month] = mes.split('-').map(Number);
    return { year, month };
  }

  protected onTotalRepartirSavings(value: number | null): void {
    this.savingsTotalRepartir.set(value);
    this.savingsHacienda.set(B100FormComponent.computeHacienda(value));
  }

  protected onTotalRepartirInvestment(value: number | null): void {
    this.investmentTotalRepartir.set(value);
    this.investmentHacienda.set(B100FormComponent.computeHacienda(value));
  }

  private static computeHacienda(totalRepartir: number | null): number | null {
    if (totalRepartir == null) { return null; }
    return roundMoney(totalRepartir * B100FormComponent.HACIENDA_RATE) ?? null;
  }

  constructor() {
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();
      this.service.loadB100History(this.SAVINGS_TIPO, year, month);
      this.service.loadB100History(this.INVESTMENT_TIPO, year, month);
      this.editingSavings.set(null);
      this.editingInvestment.set(null);
      this.resetSavingsFields();
      this.resetInvestmentFields();

      const savingsBalance = this.service.getB100Balance(this.SAVINGS_TIPO, year, month);
      if (savingsBalance) {
        this.editingSavings.set(savingsBalance);
        this.savingsBalance.set(savingsBalance.balanceMensual);
        this.savingsTotalRepartir.set(savingsBalance.dineroTotalRepartir);
        this.savingsHacienda.set(savingsBalance.dineroHacienda ?? null);
        this.savingsAporte.set(savingsBalance.aporteMensual ?? null);
      }

      const investmentBalance = this.service.getB100Balance(this.INVESTMENT_TIPO, year, month);
      if (investmentBalance) {
        this.editingInvestment.set(investmentBalance);
        this.investmentBalance.set(investmentBalance.balanceMensual);
        this.investmentTotalRepartir.set(investmentBalance.dineroTotalRepartir);
        this.investmentHacienda.set(investmentBalance.dineroHacienda ?? null);
        this.investmentAporte.set(investmentBalance.aporteMensual ?? null);
      }
    }, { allowSignalWrites: true });
  }

  private resetSavingsFields(): void {
    this.savingsBalance.set(null);
    this.savingsTotalRepartir.set(null);
    this.savingsHacienda.set(null);
    this.savingsAporte.set(null);
  }

  private resetInvestmentFields(): void {
    this.investmentBalance.set(null);
    this.investmentTotalRepartir.set(null);
    this.investmentHacienda.set(null);
    this.investmentAporte.set(null);
  }

  private fillFromBalance(balance: B100Balance, tipo: B100Subcuenta): void {
    const { year, month } = B100FormComponent.parseMes(balance.mes);
    this.service.currentYear.set(year);
    this.localMonth.set(month);
    if (tipo === this.SAVINGS_TIPO) {
      this.savingsBalance.set(balance.balanceMensual);
      this.savingsTotalRepartir.set(balance.dineroTotalRepartir);
      this.savingsHacienda.set(balance.dineroHacienda ?? null);
      this.savingsAporte.set(balance.aporteMensual ?? null);
    } else {
      this.investmentBalance.set(balance.balanceMensual);
      this.investmentTotalRepartir.set(balance.dineroTotalRepartir);
      this.investmentHacienda.set(balance.dineroHacienda ?? null);
      this.investmentAporte.set(balance.aporteMensual ?? null);
    }
  }

  protected onEdit(balance: B100Balance): void {
    this.editingSavings.set(balance);
    this.fillFromBalance(balance, this.SAVINGS_TIPO);
  }

  protected onEditInvestment(balance: B100Balance): void {
    this.editingInvestment.set(balance);
    this.fillFromBalance(balance, this.INVESTMENT_TIPO);
  }

  protected cancelEditSavings(): void {
    this.editingSavings.set(null);
    this.resetSavingsFields();
  }

  protected cancelEditInvestment(): void {
    this.editingInvestment.set(null);
    this.resetInvestmentFields();
  }

  protected onDelete(id: string): void {
    this.service.deleteB100Balance(id).subscribe();
  }

  protected onDeleteInvestment(id: string): void {
    this.service.deleteB100Balance(id).subscribe();
  }

  protected saveSavings(): void {
    this.save(this.SAVINGS_TIPO, this.savingsBalance(), this.savingsTotalRepartir(), this.savingsHacienda(), this.savingsAporte(), this.savedSavings, () => this.cancelEditSavings());
  }

  protected saveInvestment(): void {
    this.save(this.INVESTMENT_TIPO, this.investmentBalance(), this.investmentTotalRepartir(), this.investmentHacienda(), this.investmentAporte(), this.savedInvestment, () => this.cancelEditInvestment());
  }

  private save(
    tipo: B100Subcuenta,
    balance: number | null,
    totalRepartir: number | null,
    hacienda: number | null,
    aporte: number | null,
    savedSignal: ReturnType<typeof signal<boolean>>,
    doCancel: () => void,
  ): void {
    const bal = roundMoney(balance ?? 0) ?? 0;
    if (bal === null) { return; }

    const data: B100BalanceSave = {
      balanceMensual: bal,
      dineroTotalRepartir: roundMoney(totalRepartir ?? 0) ?? 0,
      dineroHacienda: roundMoney(hacienda ?? 0) ?? 0,
      aporteMensual: roundMoney(aporte ?? 0) ?? 0,
      porcentajeHacienda: B100FormComponent.HACIENDA_PERCENT,
    };

    this.service.saveB100Balance(tipo, this.localYear(), this.localMonth(), data).subscribe({
      next: () => {
        doCancel();
        savedSignal.set(true);
        setTimeout(() => savedSignal.set(false), 2000);
      },
    });
  }
}