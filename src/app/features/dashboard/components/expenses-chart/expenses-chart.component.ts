import { Component, input, effect } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartComponent } from '../../../../shared/components/base-chart/base-chart.component';

@Component({
  selector: 'app-expenses-chart',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg lg:p-5">
      <div class="mb-3 flex items-center justify-between sm:mb-4">
        <h2 class="text-sm font-semibold text-gray-900 sm:text-base">
          {{ selectedPlatformName() || title() }}
        </h2>
        <div class="flex items-center gap-2">
          @if (selectedPlatformName()) {
            <span class="text-xs text-gray-400">{{ selectedPlatformName() }}</span>
          }
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      <div class="relative h-56 sm:h-64 lg:h-72">
        <canvas aria-label="Gráfico de gastos acumulados" role="img" #canvas></canvas>
      </div>
    </div>
  `,
})
export class ExpensesChartComponent extends BaseChartComponent {
  readonly labels = input<string[]>([]);
  readonly data = input<number[]>([]);
  readonly platformColor = input<string>('');
  readonly selectedPlatformName = input<string>('');
  readonly title = input<string>('Gastos Acumulados');

  constructor() {
    super();

    effect(() => {
      if (!this.chart) { return; }
      const expenses = this.data();
      const color = this.platformColor();
      const labels = this.labels();

      this.chart.data.labels = labels;

      const lineColor = color || '#EF4444';
      const r = parseInt(lineColor.slice(1, 3), 16);
      const g = parseInt(lineColor.slice(3, 5), 16);
      const b = parseInt(lineColor.slice(5, 7), 16);

      this.chart.data.datasets = [
        {
          label: 'Gastos',
          data: expenses,
          borderColor: lineColor,
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: lineColor,
        },
      ];

      this.chart.update();
    });
  }

  protected getChartConfig(): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [{
          label: 'Gastos',
          data: this.data(),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#EF4444',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7280' } },
          y: { grid: { color: '#F3F4F6' }, ticks: { color: '#6B7280', callback: (v: string | number) => Number(v).toLocaleString('es-ES') + '€' } },
        },
      },
    };
  }
}
