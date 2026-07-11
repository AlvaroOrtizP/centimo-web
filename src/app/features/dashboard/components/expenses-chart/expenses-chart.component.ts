import { Component, input, viewChild, ElementRef, afterNextRender, effect, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-expenses-chart',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">
          {{ selectedPlatformName() || 'Gastos Acumulados' }}
        </h2>
        @if (selectedPlatformName()) {
          <span class="text-xs text-gray-400">{{ selectedPlatformName() }}</span>
        }
      </div>
      <div class="relative h-72">
        <canvas #canvas></canvas>
      </div>
    </div>
  `,
})
export class ExpensesChartComponent implements OnDestroy {
  readonly labels = input<string[]>([]);
  readonly data = input<number[]>([]);
  readonly platformColor = input<string>('');
  readonly selectedPlatformName = input<string>('');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => this.createChart());

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

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) { return; }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [
          {
            label: 'Gastos',
            data: this.data(),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#EF4444',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7280' } },
          y: { grid: { color: '#F3F4F6' }, ticks: { color: '#6B7280', callback: (v: string | number) => Number(v).toLocaleString('es-ES') + '€' } },
        },
      },
    });
  }
}
