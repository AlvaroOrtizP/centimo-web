import { Component, input, viewChild, ElementRef, afterNextRender, OnDestroy } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-balance-history-chart',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Evolución del Balance</h2>
      <div class="relative h-72">
        <canvas #canvas aria-label="Gráfico de evolución del balance" role="img"></canvas>
      </div>
    </div>
  `,
})
export class BalanceHistoryChartComponent implements OnDestroy {
  readonly labels = input<string[]>([]);
  readonly data = input<number[]>([]);
  readonly color = input<string>('#3B82F6');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    afterNextRender(() => this.createChart());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    this.chart?.destroy();
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) { return; }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.labels(),
        datasets: [{
          label: 'Balance',
          data: this.data(),
          borderColor: this.color(),
          backgroundColor: this.color() + '1A',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: this.color(),
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7280' } },
          y: { grid: { color: '#F3F4F6' }, ticks: { color: '#6B7280', callback: (v) => Number(v).toLocaleString('es-ES') + '€' } },
        },
      },
    });
  }
}
