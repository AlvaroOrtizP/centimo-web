import { Directive, viewChild, ElementRef, afterNextRender, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration } from 'chart.js';

@Directive()
export abstract class BaseChartComponent implements OnDestroy {
  protected readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  protected chart: Chart | null = null;

  constructor() {
    afterNextRender(() => this.createChart());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  protected abstract getChartConfig(): ChartConfiguration;

  protected createChart(): void {
    this.chart?.destroy();
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) { return; }
    this.chart = new Chart(canvas, this.getChartConfig());
  }

  protected updateChart(): void {
    this.chart?.update();
  }
}
