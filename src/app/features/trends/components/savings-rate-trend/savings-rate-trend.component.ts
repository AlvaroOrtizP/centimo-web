import { Component, input } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartComponent } from '../../../../shared/components/base-chart/base-chart.component';

@Component({
  selector: 'app-savings-rate-trend',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Tasa de Ahorro</h2>
      <div class="relative h-80">
        <canvas #canvas aria-label="Gráfico de tasa de ahorro" role="img"></canvas>
      </div>
    </div>
  `,
})
export class SavingsRateTrendComponent extends BaseChartComponent {
  readonly labels = input<string[]>([]);
  readonly data = input<number[]>([]);

  protected getChartConfig(): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [{
          label: 'Tasa de Ahorro',
          data: this.data(),
          borderColor: '#8B5CF6',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#8B5CF6',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${Number(ctx.parsed.y).toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7280' } },
          y: {
            grid: { color: '#F3F4F6' },
            ticks: { color: '#6B7280', callback: (v) => Number(v).toFixed(0) + '%' },
            max: 100,
          },
        },
      },
    };
  }
}
