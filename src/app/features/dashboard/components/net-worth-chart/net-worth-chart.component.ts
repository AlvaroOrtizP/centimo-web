import { Component, input, output, effect } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartComponent } from '../../../../shared/components/base-chart/base-chart.component';

export interface ChartDataset {
  label: string;
  data: number[];
  color: string;
}

@Component({
  selector: 'app-net-worth-chart',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">
          {{ selectedPlatformName() || 'Evolución Patrimonio' }}
        </h2>
        <div class="flex items-center gap-2">
          @if (selectedPlatformName()) {
            <button
              class="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              (click)="clearSelection.emit()"
            >← Volver al global</button>
          }
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      <div class="relative h-72">
        <canvas aria-label="Gráfico de evolución del patrimonio" role="img" #canvas></canvas>
      </div>
    </div>
  `,
})
export class NetWorthChartComponent extends BaseChartComponent {
  readonly labels = input<string[]>([]);
  readonly datasets = input<ChartDataset[]>([]);
  readonly platformColor = input<string>('');
  readonly selectedPlatformName = input<string>('');
  readonly clearSelection = output<void>();

  constructor() {
    super();

    effect(() => {
      if (!this.chart) { return; }
      const ds = this.datasets();
      const labels = this.labels();

      this.chart.data.labels = labels;

      this.chart.data.datasets = ds.map(d => {
        const r = parseInt(d.color.slice(1, 3), 16);
        const g = parseInt(d.color.slice(3, 5), 16);
        const b = parseInt(d.color.slice(5, 7), 16);
        return {
          label: d.label,
          data: d.data,
          borderColor: d.color,
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
          fill: ds.length === 1,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: d.color,
        };
      });

      const showLegend = ds.length > 1;
      if (this.chart.options.plugins) {
        this.chart.options.plugins.legend = { display: showLegend, position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } };
      }

      this.chart.update();
    });
  }

  protected getChartConfig(): ChartConfiguration {
    return {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [{
          label: 'Patrimonio',
          data: [],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#3B82F6',
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
