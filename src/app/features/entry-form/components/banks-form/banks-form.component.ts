import { Component, computed, effect, inject, input, signal, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS } from '../../../../core/constants/date.constants';
import { Account } from '../../../../models/account';
import { BancoBalance, BancoBalanceSave } from '../../../../models';
import { BancoHistoryTableComponent } from '../banco-history-table/banco-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

interface BancoState {
  entidad: string;
  label: string;
  color: string;
  focus: string;
  editing: WritableSignal<BancoBalance | null>;
  balance: WritableSignal<number | null>;
  aporte: WritableSignal<number | null>;
  saved: WritableSignal<boolean>;
}

const BBVA_ENTIDAD = 'bbva';
const CAIXA_ENTIDAD = 'caixa';

function createBancoState(entidad: string, label: string, color: string, focus: string): BancoState {
  return {
    entidad,
    label,
    color,
    focus,
    editing: signal<BancoBalance | null>(null),
    balance: signal<number | null>(null),
    aporte: signal<number | null>(null),
    saved: signal(false),
  };
}

@Component({
  selector: 'app-banks-form',
  standalone: true,
  imports: [FormsModule, BancoHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Selector mes -->
      <div class="flex gap-2">
        <select
          aria-label="Mes"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          [ngModel]="localMonth()"
          (ngModelChange)="localMonth.set($event)"
        >
          @for (m of months; track m.value) {
            <option [ngValue]="m.value">{{ m.label }}</option>
          }
        </select>
      </div>

      @for (banco of bancoStates; track banco.entidad) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 class="mb-4 text-sm font-semibold text-gray-900">{{ banco.label }}</h3>

          @if (previousBancoBalance(banco) !== null) {
            <div class="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
              Balance mes anterior: <strong>{{ previousBancoBalance(banco)!.toLocaleString('es-ES') }} €</strong>
            </div>
          }

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Balance a final de mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 4000"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm {{ banco.focus }}"
                [ngModel]="banco.balance()"
                (ngModelChange)="banco.balance.set($event)"
              />
            </div>
            <div>
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
              <input
                type="number"
                step="any"
                placeholder="ej: 100"
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm {{ banco.focus }}"
                [ngModel]="banco.aporte()"
                (ngModelChange)="banco.aporte.set($event)"
              />
            </div>
          </div>

          <div class="mt-4 flex items-center gap-3">
            <button
              class="rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              [style.background-color]="banco.color"
              [disabled]="banco.balance() == null"
              (click)="save(banco)"
            >{{ banco.editing() ? 'Actualizar balance' : 'Guardar' }}</button>
            @if (banco.editing()) {
              <button
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                (click)="cancelEdit(banco)"
              >Cancelar</button>
            }
            @if (banco.saved()) {
              <span class="text-sm text-emerald-600">✓ Guardado</span>
            }
          </div>
        </div>

        <!-- Historial -->
        @if (bancoHistory(banco).length > 0) {
          <div>
            <app-banco-history-table
              [balances]="bancoHistory(banco)"
              [headingTooltip]="'Balance y aportación de ' + banco.label"
              (edit)="onEdit(banco, $event)"
              (delete)="onDelete($event)"
            />
          </div>
        }
      }
    </div>
  `,
})
export class BanksFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  protected readonly months = MONTH_OPTIONS;

  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly bancoStates: BancoState[] = [
    createBancoState(BBVA_ENTIDAD, 'BBVA — Cuenta Nómina', '#004481', 'focus:border-blue-800 focus:ring-blue-800'),
    createBancoState(CAIXA_ENTIDAD, 'CaixaBank — Cuenta alternativa', '#E65100', 'focus:border-orange-600 focus:ring-orange-600'),
  ];

  constructor() {
    // Solo limpia y carga al cambiar de mes/año. No depende de `balances`, así
    // que guardar un banco no resetea los campos no guardados del otro.
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();

      this.service.loadBancoHistory(BBVA_ENTIDAD, year, month);
      this.service.loadBancoHistory(CAIXA_ENTIDAD, year, month);

      this.resetFields();
    }, { allowSignalWrites: true });

    // Precarga el balance del mes cuando llegan datos, sin pisar lo que el
    // usuario esté escribiendo (solo rellena si el campo está vacío).
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();

      this.fillExisting(BBVA_ENTIDAD, year, month);
      this.fillExisting(CAIXA_ENTIDAD, year, month);
    }, { allowSignalWrites: true });
  }

  protected previousBancoBalance(banco: BancoState): number | null {
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    return this.service.getBancoBalance(banco.entidad, prevYear, prevMonth)?.balanceMensual ?? null;
  }

  protected bancoHistory(banco: BancoState): BancoBalance[] {
    const since = BanksFormComponent.toMes(this.localYear(), this.localMonth());
    return this.service.getBancoBalances(banco.entidad)
      .filter(b => b.mes <= since)
      .sort((a, b) => (a.mes < b.mes ? 1 : -1));
  }

  protected onEdit(banco: BancoState, balance: BancoBalance): void {
    banco.editing.set(balance);
    const { year, month } = BanksFormComponent.parseMes(balance.mes);
    this.service.currentYear.set(year);
    this.localMonth.set(month);
    banco.balance.set(balance.balanceMensual);
    banco.aporte.set(balance.aporteMensual ?? null);
  }

  protected cancelEdit(banco: BancoState): void {
    banco.editing.set(null);
    banco.balance.set(null);
    banco.aporte.set(null);
  }

  protected onDelete(id: string): void {
    this.service.deleteBancoBalance(id).subscribe();
  }

  protected save(banco: BancoState): void {
    const bal = roundMoney(banco.balance() ?? 0) ?? 0;
    if (bal === null) { return; }

    const data: BancoBalanceSave = {
      balanceMensual: bal,
      aporteMensual: roundMoney(banco.aporte() ?? 0) ?? 0,
    };

    this.service.saveBancoBalance(banco.entidad, this.localYear(), this.localMonth(), data).subscribe({
      next: () => {
        this.cancelEdit(banco);
        banco.saved.set(true);
        setTimeout(() => banco.saved.set(false), 2000);
      },
    });
  }

  private resetFields(): void {
    this.bancoStates.forEach(banco => this.cancelEdit(banco));
  }

  private fillExisting(entidad: string, year: number, month: number): void {
    const balance = this.service.getBancoBalance(entidad, year, month);
    const banco = this.bancoStates.find(s => s.entidad === entidad);
    if (balance && banco && banco.balance() === null) {
      banco.editing.set(balance);
      banco.balance.set(balance.balanceMensual);
      banco.aporte.set(balance.aporteMensual ?? null);
    }
  }

  private static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private static parseMes(mes: string): { year: number; month: number } {
    const [year, month] = mes.split('-').map(Number);
    return { year, month };
  }
}