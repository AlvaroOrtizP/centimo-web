import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS } from '../../../../core/constants/date.constants';
import { UrbanitaeBalance, UrbanitaeBalanceSave, UrbanitaeCompra, UrbanitaeCompraEstado, UrbanitaeCompraSave } from '../../../../models';
import { UrbanitaeHistoryTableComponent } from '../urbanitae-history-table/urbanitae-history-table.component';
import { roundMoney } from '../../../../core/utils/money.util';

@Component({
  selector: 'app-urbanitae-form',
  standalone: true,
  imports: [FormsModule, UrbanitaeHistoryTableComponent],
  template: `
    <div class="space-y-4">
      <!-- Balance mensual -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Urbanitae — Balance mensual</h3>

        <div class="mb-4 flex gap-2">
          <select
            aria-label="Mes"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            [ngModel]="localMonth()"
            (ngModelChange)="localMonth.set($event)"
          >
            @for (m of months; track m.value) {
              <option [ngValue]="m.value">{{ m.label }}</option>
            }
          </select>
        </div>

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
              placeholder="ej: 3000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="balance()"
              (ngModelChange)="balance.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Valor total en Urbanitae a 31 del mes</p>
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Aportación este mes (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 100"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
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
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="dineroTotal()"
              (ngModelChange)="onDineroTotalChange($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Rendimiento generado por Urbanitae</p>
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
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="dineroFinal()"
              (ngModelChange)="dineroFinal.set($event)"
            />
            <p class="mt-0.5 text-xs text-gray-400">Total menos Hacienda (auto, editable)</p>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            [disabled]="balance() == null"
            (click)="saveBalance()"
          >{{ editingBalance() ? 'Actualizar balance' : 'Guardar' }}</button>
          @if (editingBalance()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditBalance()"
            >Cancelar</button>
          }
          @if (savedBalance()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Historial de balances -->
      <app-urbanitae-history-table
        [balances]="history()"
        (edit)="onEditBalance($event)"
        (delete)="onDeleteBalance($event)"
      />

      <!-- Compras -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 class="mb-4 text-sm font-semibold text-gray-900">Registrar compra</h3>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</label>
            <input
              type="date"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="compraFecha()"
              (ngModelChange)="compraFecha.set($event)"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Entidad / promotor</label>
            <input
              type="text"
              placeholder="ej: Vivienda Madrid"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="compraEntidad()"
              (ngModelChange)="compraEntidad.set($event)"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Monto (€)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 1000"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="compraMonto()"
              (ngModelChange)="compraMonto.set($event)"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Rendimiento (%)</label>
            <input
              type="number"
              step="any"
              placeholder="ej: 8.5"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="compraRendimiento()"
              (ngModelChange)="compraRendimiento.set($event)"
            />
          </div>
          <div>
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Estado</label>
            <select
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              [ngModel]="compraEstado()"
              (ngModelChange)="compraEstado.set($event)"
            >
              <option [ngValue]="'activa'">Activa</option>
              <option [ngValue]="'vendida'">Vendida</option>
            </select>
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            class="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            [disabled]="!canSaveCompra()"
            (click)="saveCompra()"
          >{{ editingCompra() ? 'Actualizar compra' : 'Registrar compra' }}</button>
          @if (editingCompra()) {
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              (click)="cancelEditCompra()"
            >Cancelar</button>
          }
          @if (savedCompra()) {
            <span class="text-sm text-emerald-600">✓ Guardado</span>
          }
        </div>
      </div>

      <!-- Lista de compras -->
      @if (compras().length > 0) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Compras registradas ({{ compras().length }})</p>
          <div class="space-y-1">
            @for (c of compras(); track c.id) {
              <div class="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="h-2 w-2 rounded-full" [class.bg-emerald-500]="c.estado === 'activa'" [class.bg-gray-400]="c.estado === 'vendida'"></span>
                <span class="min-w-40 font-semibold text-gray-900">{{ c.entidad }}</span>
                <span class="text-gray-500">{{ formatFecha(c.fecha) }}</span>
                <span class="font-medium text-gray-700">{{ c.monto.toLocaleString('es-ES') }} €</span>
                <span class="text-gray-400">{{ c.rendimiento ?? '-' }}%</span>
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  [class.bg-emerald-100]="c.estado === 'activa'"
                  [class.bg-gray-100]="c.estado === 'vendida'"
                  [class.text-emerald-700]="c.estado === 'activa'"
                  [class.text-gray-500]="c.estado === 'vendida'"
                >{{ c.estado === 'activa' ? 'Activa' : 'Vendida' }}</span>
                <div class="ml-auto flex items-center gap-1">
                  <button
                    class="rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                    [class.bg-gray-100]="c.estado === 'activa'"
                    [class.hover:bg-gray-200]="c.estado === 'activa'"
                    [class.text-gray-700]="c.estado === 'activa'"
                    [class.bg-emerald-50]="c.estado === 'vendida'"
                    [class.hover:bg-emerald-100]="c.estado === 'vendida'"
                    [class.text-emerald-700]="c.estado === 'vendida'"
                    (click)="toggleEstado(c)"
                  >{{ c.estado === 'activa' ? 'Marcar como vendida' : 'Marcar como activa' }}</button>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                    (click)="onEditCompra(c)"
                    title="Editar compra"
                    aria-label="Editar compra"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                    </svg>
                  </button>
                  <button
                    class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    (click)="deleteCompra(c.id)"
                    title="Eliminar compra"
                    aria-label="Eliminar compra"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class UrbanitaeFormComponent {
  private readonly service = inject(FinancialDataService);

  protected readonly months = MONTH_OPTIONS;

  private static readonly HACIENDA_PERCENT = 19;
  private static readonly HACIENDA_RATE = 0.19;

  // --- Balance mensual ---
  protected readonly localMonth = signal(this.service.currentMonth());
  protected readonly localYear = computed(() => this.service.currentYear());

  protected readonly editingBalance = signal<UrbanitaeBalance | null>(null);
  protected readonly balance = signal<number | null>(null);
  protected readonly aporte = signal<number | null>(null);
  protected readonly dineroTotal = signal<number | null>(null);
  protected readonly hacienda = signal<number | null>(null);
  protected readonly dineroFinal = signal<number | null>(null);
  protected readonly savedBalance = signal(false);

  protected readonly previousBalance = computed(() => this.getPreviousBalance());

  protected readonly history = computed(() => {
    const since = UrbanitaeFormComponent.toMes(this.localYear(), this.localMonth());
    return this.service.getUrbanitaeBalances()
      .filter(b => b.mes <= since)
      .sort((a, b) => (a.mes < b.mes ? 1 : -1));
  });

  // --- Compras ---
  protected readonly editingCompra = signal<UrbanitaeCompra | null>(null);
  protected readonly compraFecha = signal(new Date().toISOString().slice(0, 10));
  protected readonly compraEntidad = signal('');
  protected readonly compraMonto = signal<number | null>(null);
  protected readonly compraRendimiento = signal<number | null>(null);
  protected readonly compraEstado = signal<UrbanitaeCompraEstado>('activa');
  protected readonly savedCompra = signal(false);

  protected readonly compras = computed(() => this.service.getUrbanitaeCompras());

  protected readonly canSaveCompra = computed(() =>
    this.compraFecha().trim().length > 0 &&
    this.compraEntidad().trim().length > 0 &&
    this.compraMonto() != null && Number(this.compraMonto()) > 0
  );

  constructor() {
    effect(() => {
      const year = this.localYear();
      const month = this.localMonth();
      this.service.loadUrbanitaeHistory(year, month);
      this.editingBalance.set(null);
      this.resetBalanceFields();

      const balance = this.service.getUrbanitaeBalance(year, month);
      if (balance) {
        this.editingBalance.set(balance);
        this.balance.set(balance.balanceMensual);
        this.aporte.set(balance.aporteMensual ?? null);
        this.dineroTotal.set(balance.dineroTotal ?? null);
        this.hacienda.set(balance.dineroHacienda ?? null);
        this.dineroFinal.set(balance.dineroFinal ?? null);
      }
    }, { allowSignalWrites: true });

    this.service.loadUrbanitaeCompras();
  }

  // --- Balance mensual ---
  private getPreviousBalance(): number | null {
    let prevMonth = this.localMonth() - 1;
    let prevYear = this.localYear();
    if (prevMonth < 1) { prevMonth = 12; prevYear--; }
    return this.service.getUrbanitaeBalance(prevYear, prevMonth)?.balanceMensual ?? null;
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
    this.hacienda.set(UrbanitaeFormComponent.computeHacienda(value));
    this.dineroFinal.set(UrbanitaeFormComponent.computeFinal(value, this.hacienda()));
  }

  protected onHaciendaChange(value: number | null): void {
    this.hacienda.set(value);
    this.dineroFinal.set(UrbanitaeFormComponent.computeFinal(this.dineroTotal(), value));
  }

  private static computeHacienda(dineroTotal: number | null): number | null {
    if (dineroTotal == null) { return null; }
    return roundMoney(dineroTotal * UrbanitaeFormComponent.HACIENDA_RATE) ?? null;
  }

  private static computeFinal(dineroTotal: number | null, hacienda: number | null): number | null {
    if (dineroTotal == null || hacienda == null) { return null; }
    return roundMoney(dineroTotal - hacienda) ?? null;
  }

  private resetBalanceFields(): void {
    this.balance.set(null);
    this.aporte.set(null);
    this.dineroTotal.set(null);
    this.hacienda.set(null);
    this.dineroFinal.set(null);
  }

  private fillFromBalance(balance: UrbanitaeBalance): void {
    const { year, month } = UrbanitaeFormComponent.parseMes(balance.mes);
    this.service.currentYear.set(year);
    this.localMonth.set(month);
    this.balance.set(balance.balanceMensual);
    this.aporte.set(balance.aporteMensual ?? null);
    this.dineroTotal.set(balance.dineroTotal ?? null);
    this.hacienda.set(balance.dineroHacienda ?? null);
    this.dineroFinal.set(balance.dineroFinal ?? null);
  }

  protected onEditBalance(balance: UrbanitaeBalance): void {
    this.editingBalance.set(balance);
    this.fillFromBalance(balance);
  }

  protected cancelEditBalance(): void {
    this.editingBalance.set(null);
    this.resetBalanceFields();
  }

  protected onDeleteBalance(id: string): void {
    this.service.deleteUrbanitaeBalance(id).subscribe();
  }

  protected saveBalance(): void {
    const bal = roundMoney(this.balance() ?? 0) ?? 0;
    if (bal === null) { return; }

    const data: UrbanitaeBalanceSave = {
      balanceMensual: bal,
      aporteMensual: roundMoney(this.aporte() ?? 0) ?? 0,
      dineroTotal: roundMoney(this.dineroTotal() ?? 0) ?? 0,
      dineroHacienda: roundMoney(this.hacienda() ?? 0) ?? 0,
      dineroFinal: roundMoney(this.dineroFinal() ?? 0) ?? 0,
    };

    this.service.saveUrbanitaeBalance(this.localYear(), this.localMonth(), data).subscribe({
      next: () => {
        this.cancelEditBalance();
        this.savedBalance.set(true);
        setTimeout(() => this.savedBalance.set(false), 2000);
      },
    });
  }

  // --- Compras ---
  protected formatFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  }

  protected onEditCompra(compra: UrbanitaeCompra): void {
    this.editingCompra.set(compra);
    this.compraFecha.set(compra.fecha);
    this.compraEntidad.set(compra.entidad);
    this.compraMonto.set(compra.monto);
    this.compraRendimiento.set(compra.rendimiento ?? null);
    this.compraEstado.set(compra.estado);
  }

  protected cancelEditCompra(): void {
    this.editingCompra.set(null);
    this.compraFecha.set(new Date().toISOString().slice(0, 10));
    this.compraEntidad.set('');
    this.compraMonto.set(null);
    this.compraRendimiento.set(null);
    this.compraEstado.set('activa');
  }

  protected toggleEstado(compra: UrbanitaeCompra): void {
    const next: UrbanitaeCompraEstado = compra.estado === 'activa' ? 'vendida' : 'activa';
    this.service.setUrbanitaeCompraEstado(compra.id, next).subscribe();
  }

  protected deleteCompra(id: string): void {
    this.service.deleteUrbanitaeCompra(id).subscribe();
  }

  protected saveCompra(): void {
    const monto = roundMoney(this.compraMonto() ?? 0) ?? 0;
    if (monto === null) { return; }

    const data: UrbanitaeCompraSave = {
      fecha: this.compraFecha(),
      entidad: this.compraEntidad().trim(),
      monto,
      rendimiento: this.compraRendimiento() ?? undefined,
      estado: this.compraEstado(),
    };

    const call$ = this.editingCompra()
      ? this.service.updateUrbanitaeCompra(this.editingCompra()!.id, data)
      : this.service.saveUrbanitaeCompra(data);

    call$.subscribe({
      next: () => {
        this.cancelEditCompra();
        this.savedCompra.set(true);
        setTimeout(() => this.savedCompra.set(false), 2000);
      },
    });
  }
}