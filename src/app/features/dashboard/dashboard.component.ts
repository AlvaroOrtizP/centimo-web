import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTHS_SHORT } from '../../core/constants/date.constants';
import {
  DASHBOARD_CATEGORIA_OPTIONS,
  DASHBOARD_CATEGORIAS,
  DASHBOARD_DEFAULT_MESES_ATRAS,
  DASHBOARD_ENTITY_COLORS,
  DASHBOARD_ENTITY_NAMES,
  DASHBOARD_ENTITY_ORDER,
  DASHBOARD_GASTOS_CODE,
} from '../../core/constants/dashboard.constants';
import { DashboardCategoria } from '../../api/generated/model/dashboardCategoria';
import { DashboardSerieBalance } from '../../api/generated/model/dashboardSerieBalance';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { EntityBalanceTableComponent, EntityBalanceRow } from './components/entity-balance-table/entity-balance-table.component';
import { NetWorthChartComponent, ChartDataset } from './components/net-worth-chart/net-worth-chart.component';
import { ExpensesChartComponent } from './components/expenses-chart/expenses-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CollapsibleDescriptionComponent, SummaryCardsComponent, EntityBalanceTableComponent, NetWorthChartComponent, ExpensesChartComponent, MonthPickerComponent],
  template: `
    <div class="space-y-4 lg:space-y-6">
      <app-collapsible-description description="Balance mensual consolidado de todas las entidades y evolución por entidad o categoría." storageKey="desc-dashboard" />
      <div class="flex justify-end items-center gap-3">
        <button
          type="button"
          title="resetear datos cache"
          class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          (click)="reloadDashboard()"
        >Resetear cache</button>
        @if (selectedEntidad()) {
          <div class="flex items-center gap-1.5 rounded-lg border border-[#00A3E0] bg-[#00A3E0]/5 px-2.5 py-1 text-xs font-medium text-[#00A3E0]">
            <span class="max-w-[140px] truncate">{{ selectedEntityName() }}</span>
            <button
              type="button"
              class="font-semibold underline-offset-2 hover:underline"
              (click)="resetView()"
            >Ver todo</button>
          </div>
        }
        <app-month-picker />
      </div>
      <app-summary-cards [summary]="summaryCards()" [previousSummary]="previousSummaryCards()" />
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        <app-entity-balance-table
          [entities]="entityRows()"
          [selectedCodigo]="selectedEntidad()"
          (entityClick)="onEntityClick($event)"
        />
        <app-net-worth-chart
          [labels]="evolutionLabels()"
          [datasets]="evolutionDatasets()"
          [platformColor]="selectedEntityColor()"
          [selectedPlatformName]="selectedEntityName()"
          (clearSelection)="resetView()"
        />
      </div>
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
        <app-net-worth-chart
          [labels]="categoryLabels()"
          [datasets]="categoryDatasets()"
          title="Evolución por Categoría"
        >
          <div actions class="flex items-center gap-2">
            <select
              aria-label="Categoría"
              class="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 focus:border-gray-300 focus:outline-none"
              [ngModel]="selectedCategoria()"
              (ngModelChange)="onCategoriaChange($event)"
            >
              @for (option of DASHBOARD_CATEGORIA_OPTIONS; track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
            </select>
          </div>
        </app-net-worth-chart>
        <app-expenses-chart
          [labels]="expensesLabels()"
          [data]="expensesData()"
          title="Gastos por Mes"
        />
      </div>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly DASHBOARD_CATEGORIA_OPTIONS = DASHBOARD_CATEGORIA_OPTIONS;

  protected readonly service = inject(FinancialDataService);
  protected readonly selectedEntidad = signal<string | null>(null);
  protected readonly selectedCategoria = signal<DashboardCategoria>(DashboardCategoria.Todas);

  protected readonly currentMes = computed(() =>
    DashboardComponent.toMes(this.service.currentYear(), this.service.currentMonth())
  );

  constructor() {
    effect(() => {
      this.currentMes();
      this.selectedEntidad();
      this.selectedCategoria();
      this.loadDashboards(false);
    }, { allowSignalWrites: true });
  }

  protected readonly dashboardBalance = computed(() =>
    this.service.getDashboardBalance(this.currentMes())
  );

  protected readonly serieTotal = computed(() =>
    this.service.getDashboardSerie(undefined, this.currentMes())
  );

  protected readonly serieGastos = computed(() =>
    this.service.getDashboardSerie(DASHBOARD_GASTOS_CODE, this.currentMes())
  );

  protected readonly serieEntidad = computed(() => {
    const entidad = this.selectedEntidad();
    return entidad ? this.service.getDashboardSerie(entidad, this.currentMes()) : undefined;
  });

  protected readonly serieCategoria = computed(() =>
    this.service.getDashboardCategoriaSerie(this.selectedCategoria(), this.currentMes())
  );

  protected readonly entityRows = computed<EntityBalanceRow[]>(() => {
    const entidades = this.dashboardBalance()?.entidades ?? [];
    const byCode = new Map(entidades.map(e => [e.codigo, e]));
    const ordered = [
      ...DASHBOARD_ENTITY_ORDER.filter(code => byCode.has(code)).map(code => byCode.get(code)!),
      ...entidades.filter(e => !DASHBOARD_ENTITY_ORDER.includes(e.codigo)),
    ];
    const rows: EntityBalanceRow[] = ordered.map(e => ({
      codigo: e.codigo,
      nombre: e.nombre,
      balance: e.balance,
      aporte: e.aporte,
      color: DASHBOARD_ENTITY_COLORS[e.codigo] ?? '#6B7280',
      pct: 0,
    }));
    const maxBalance = Math.max(...rows.map(r => r.balance), 1);
    for (const row of rows) {
      row.pct = (row.balance / maxBalance) * 100;
    }
    return rows;
  });

  protected readonly summaryCards = computed(() => {
    const balance = this.dashboardBalance();
    return {
      total: balance?.total ?? 0,
      aportes: balance?.entidades.reduce((sum, e) => sum + (e.aporte ?? 0), 0) ?? 0,
      entidades: balance?.entidades.length ?? 0,
      gastos: this.serieGastos()?.at(-1)?.balance ?? 0,
    };
  });

  protected readonly previousSummaryCards = computed(() => {
    const total = this.serieTotal();
    const gastos = this.serieGastos();
    return {
      total: this.secondToLast(total)?.balance ?? 0,
      aportes: this.secondToLast(total)?.aporte ?? 0,
      gastos: this.secondToLast(gastos)?.balance ?? 0,
    };
  });

  protected readonly evolutionSerie = computed(() =>
    this.selectedEntidad() ? this.serieEntidad() : this.serieTotal()
  );

  protected readonly evolutionLabels = computed(() =>
    (this.evolutionSerie() ?? []).map(s => this.mesLabel(s.mes))
  );

  protected readonly evolutionDatasets = computed<ChartDataset[]>(() => {
    const serie = this.evolutionSerie();
    if (!serie) { return []; }
    const entidad = this.selectedEntidad();
    if (entidad) {
      return [{
        label: DASHBOARD_ENTITY_NAMES[entidad] ?? entidad,
        data: serie.map(s => s.balance),
        color: DASHBOARD_ENTITY_COLORS[entidad] ?? '#3B82F6',
      }];
    }
    return [{
      label: 'Patrimonio',
      data: serie.map(s => s.balance),
      color: '#3B82F6',
    }];
  });

  protected readonly categoryLabels = computed(() =>
    this.categoryMesLabels().map(mes => this.mesLabel(mes))
  );

  protected readonly categoryDatasets = computed<ChartDataset[]>(() => {
    const labels = this.categoryMesLabels();
    const rows = this.serieCategoria() ?? [];
    const byCode = new Map<string, Map<string, number>>();
    for (const row of rows) {
      let months = byCode.get(row.codigo);
      if (!months) {
        months = new Map<string, number>();
        byCode.set(row.codigo, months);
      }
      months.set(row.mes, row.balance);
    }
    const order = DASHBOARD_CATEGORIAS[this.selectedCategoria()] ?? DASHBOARD_ENTITY_ORDER;
    return order
      .filter(code => byCode.has(code))
      .map(code => ({
        label: DASHBOARD_ENTITY_NAMES[code] ?? code,
        data: labels.map(mes => byCode.get(code)?.get(mes) ?? 0),
        color: DASHBOARD_ENTITY_COLORS[code] ?? '#6B7280',
      }));
  });

  protected readonly expensesLabels = computed(() =>
    (this.serieGastos() ?? []).map(s => this.mesLabel(s.mes))
  );

  protected readonly expensesData = computed(() =>
    (this.serieGastos() ?? []).map(s => s.balance)
  );

  protected readonly selectedEntityName = computed(() => {
    const entidad = this.selectedEntidad();
    return entidad ? (DASHBOARD_ENTITY_NAMES[entidad] ?? entidad) : '';
  });

  protected readonly selectedEntityColor = computed(() => {
    const entidad = this.selectedEntidad();
    return entidad ? (DASHBOARD_ENTITY_COLORS[entidad] ?? '') : '';
  });

  onEntityClick(codigo: string): void {
    this.selectedEntidad.update(current => current === codigo ? null : codigo);
  }

  onCategoriaChange(value: unknown): void {
    this.selectedCategoria.set(value as DashboardCategoria);
  }

  resetView(): void {
    this.selectedEntidad.set(null);
  }

  reloadDashboard(): void {
    this.loadDashboards(true);
  }

  private categoryMesLabels(): string[] {
    const rows = this.serieCategoria() ?? [];
    const seen = new Set<string>();
    const labels: string[] = [];
    for (const row of rows) {
      if (!seen.has(row.mes)) {
        seen.add(row.mes);
        labels.push(row.mes);
      }
    }
    return labels;
  }

  private loadDashboards(force: boolean): void {
    const mes = this.currentMes();
    const entidad = this.selectedEntidad();
    const categoria = this.selectedCategoria();

    untracked(() => {
      this.service.loadDashboardBalance(mes, force);
      this.service.loadDashboardSerie(undefined, mes, DASHBOARD_DEFAULT_MESES_ATRAS, force);
      this.service.loadDashboardSerie(DASHBOARD_GASTOS_CODE, mes, DASHBOARD_DEFAULT_MESES_ATRAS, force);
      if (entidad) {
        this.service.loadDashboardSerie(entidad, mes, DASHBOARD_DEFAULT_MESES_ATRAS, force);
      }
      this.service.loadDashboardCategoriaSerie(categoria, mes, DASHBOARD_DEFAULT_MESES_ATRAS, force);
    });
  }

  private mesLabel(mes: string): string {
    const [year, month] = mes.split('-').map(Number);
    return `${MONTHS_SHORT[month - 1]} ${year}`;
  }

  private secondToLast(serie: DashboardSerieBalance[] | undefined): DashboardSerieBalance | undefined {
    if (!serie || serie.length < 2) { return undefined; }
    return serie[serie.length - 2];
  }

  private static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}