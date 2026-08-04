import { Component, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartComponent } from '../../../../shared/components/base-chart/base-chart.component';

@Component({
  selector: 'app-platform-distribution',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Distribución por Plataforma</h2>
      <div class="relative h-80">
        <canvas #canvas aria-label="Gráfico de distribución por plataforma" role="img"></canvas>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        @for (item of items(); track item.name) {
          <span class="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" [style.background-color]="item.color + '20'" [style.color]="item.color">
            <span class="h-2 w-2 rounded-full" [style.background-color]="item.color"></span>
            {{ item.name }}: {{ item.value.toLocaleString('es-ES') }} €
          </span>
        }
      </div>
    </div>
  `,
})
export class PlatformDistributionComponent extends BaseChartComponent {
  readonly items = input<{ name: string; value: number; color: string }[]>([]);

  protected getChartConfig(): ChartConfiguration {
    const data = this.items();
    return {
      type: 'doughnut',
      data: {
        labels: data.map(i => i.name),
        datasets: [{
          data: data.map(i => i.value),
          backgroundColor: data.map(i => i.color),
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
