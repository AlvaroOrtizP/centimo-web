import { Component, input, viewChild, ElementRef, afterNextRender, OnDestroy } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-income-vs-expenses',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Ingresos vs Gastos</h2>
      <div class="relative h-80">
        <canvas #canvas aria-label="Gráfico de ingresos vs gastos" role="img"></canvas>
      </div>
    </div>
  `,
})
export class IncomeVsExpensesComponent implements OnDestroy {
  readonly labels = input<string[]>([]);
  readonly incomes = input<number[]>([]);
  readonly expenses = input<number[]>([]);

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
      type: 'bar',
      data: {
        labels: this.labels(),
        datasets: [
          {
            label: 'Ingresos',
            data: this.incomes(),
            backgroundColor: '#22C55E',
            borderRadius: 4,
          },
          {
            label: 'Gastos',
            data: this.expenses(),
            backgroundColor: '#EF4444',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, padding: 16, color: '#374151' },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6B7280' } },
          y: { grid: { color: '#F3F4F6' }, ticks: { color: '#6B7280', callback: (v) => Number(v).toLocaleString('es-ES') + '€' } },
        },
      },
    });
  }
}
