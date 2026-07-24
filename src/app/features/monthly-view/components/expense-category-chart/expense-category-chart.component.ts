import { Component, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartComponent } from '../../../../shared/components/base-chart/base-chart.component';
import { Expense } from '../../../../models';

const CATEGORY_COLORS: Record<string, string> = {
  aseo: '#FCD34D',
  coche: '#F97316',
  comida: '#22C55E',
  discord: '#8B5CF6',
  ejercicio: '#3B82F6',
  hacienda: '#EF4444',
  medicamento: '#EC4899',
  ocio: '#A855F7',
  otros: '#6B7280',
  trabajo: '#06B6D4',
};

@Component({
  selector: 'app-expense-category-chart',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Gastos por Categoría</h2>
      <div class="relative h-72">
        <canvas #canvas aria-label="Gráfico de gastos por categoría" role="img"></canvas>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        @for (item of aggregated(); track item.category) {
          <span class="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" [style.background-color]="item.color + '20'" [style.color]="item.color">
            <span class="h-2 w-2 rounded-full" [style.background-color]="item.color"></span>
            {{ item.category }}: {{ item.total }} €
          </span>
        }
      </div>
    </div>
  `,
})
export class ExpenseCategoryChartComponent extends BaseChartComponent {
  readonly expenses = input<Expense[]>([]);

  protected aggregated = () => {
    const groups = new Map<string, number>();
    for (const e of this.expenses()) {
      groups.set(e.category, (groups.get(e.category) ?? 0) + e.amount);
    }
    return Array.from(groups.entries()).map(([category, total]) => ({
      category,
      total,
      color: CATEGORY_COLORS[category] ?? '#6B7280',
    })).sort((a, b) => b.total - a.total);
  };

  protected getChartConfig(): ChartConfiguration {
    const items = this.aggregated();
    return {
      type: 'doughnut',
      data: {
        labels: items.map(i => i.category),
        datasets: [{
          data: items.map(i => i.total),
          backgroundColor: items.map(i => i.color),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    };
  }
}
