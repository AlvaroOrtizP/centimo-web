import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DashboardCategoria } from '../../../../api/generated/model/dashboardCategoria';
import { DASHBOARD_CATEGORIAS } from '../../../../core/constants/dashboard.constants';

export interface EntityBalanceRow {
  codigo: string;
  nombre: string;
  balance: number;
  aporte: number;
  color: string;
  pct: number;
}

type EntityFilter = DashboardCategoria | 'all';

@Component({
  selector: 'app-entity-balance-table',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-lg transition-shadow duration-200 hover:shadow-xl">
      <div class="border-b border-gray-100 px-4 py-3 lg:px-5 lg:py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900 sm:text-base">Entidades</h2>
          <div class="flex items-center gap-3">
            <select
              aria-label="Filtrar entidades"
              class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 focus:border-gray-300 focus:outline-none"
              [ngModel]="filter()"
              (ngModelChange)="onFilterChange($event)"
            >
              <option value="all">Todas</option>
              <option [value]="DashboardCategoria.Liquidez">Liquidez</option>
              <option [value]="DashboardCategoria.Fija">Fija</option>
              <option [value]="DashboardCategoria.Variable">Variable</option>
            </select>
            <span class="text-xs font-medium text-gray-400">{{ filteredRows().length }} entidades</span>
          </div>
        </div>
      </div>
      <div class="divide-y divide-gray-100">
        @for (row of filteredRows(); track row.codigo) {
          <div
            class="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/80 lg:gap-4 lg:px-5 lg:py-3.5"
            [class.ring-2]="selectedCodigo() === row.codigo"
            [class.ring-gray-300]="selectedCodigo() === row.codigo"
            (click)="entityClick.emit(row.codigo)"
          >
            <span class="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-110 lg:h-8 lg:w-8" [style.background-color]="row.color + '15'">
              <span class="h-2.5 w-2.5 rounded-full" [style.background-color]="row.color"></span>
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium text-gray-900 sm:text-sm">{{ row.nombre }}</p>
              <div class="mt-1 h-1.5 w-full max-w-[80px] overflow-hidden rounded-full bg-gray-100 sm:max-w-[120px]">
                <div class="h-full rounded-full transition-all duration-500" [style.width.%]="row.pct" [style.background-color]="row.color"></div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[13px] font-semibold text-gray-900 sm:text-sm">{{ row.balance.toLocaleString('es-ES') }} €</p>
              <p class="mt-0.5 text-[11px] text-gray-400 sm:text-xs">{{ row.aporte > 0 ? '+' + row.aporte.toLocaleString('es-ES') : 'sin aporte' }}</p>
            </div>
          </div>
        }
        @if (filteredRows().length === 0) {
          <div class="px-4 py-8 text-center text-sm text-gray-400 lg:px-5">
            No hay entidades con balance este mes
          </div>
        }
      </div>
    </div>
  `,
})
export class EntityBalanceTableComponent {
  protected readonly DashboardCategoria = DashboardCategoria;

  readonly entities = input.required<EntityBalanceRow[]>();
  readonly selectedCodigo = input<string | null>(null);

  readonly entityClick = output<string>();

  protected readonly filter = signal<EntityFilter>('all');

  protected onFilterChange(value: unknown): void {
    this.filter.set(value as EntityFilter);
  }

  protected readonly filteredRows = computed(() => {
    const f = this.filter();
    if (f === 'all') { return this.entities(); }
    const allowed = new Set(DASHBOARD_CATEGORIAS[f] ?? []);
    return this.entities().filter(e => allowed.has(e.codigo));
  });
}