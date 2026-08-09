import { Component, input } from '@angular/core';

interface CardConfig {
  label: string;
  value: string;
  change: number | null;
  icon: string;
  gradient: string;
  accent: string;
}

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  template: `
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      @for (card of cards; track card.label) {
        <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-lg transition-all duration-200 hover:shadow-xl lg:p-5">
          <div class="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full opacity-10 transition-all duration-300 group-hover:opacity-20" [style.background]="card.gradient"></div>
          <div class="flex items-start justify-between">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">{{ card.label }}</p>
              <p class="mt-1 text-lg font-bold tracking-tight text-gray-900 sm:mt-1.5 sm:text-xl lg:text-2xl">{{ card.value }}</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center rounded-lg lg:h-10 lg:w-10" [style.background]="card.accent + '15'">
              <span [innerHTML]="card.icon" [style.color]="card.accent"></span>
            </div>
          </div>
          @if (card.change !== null) {
            <div class="mt-2 flex items-center gap-1 sm:mt-3">
              <span [class.text-green-600]="card.change >= 0" [class.text-red-600]="card.change < 0" class="flex items-center text-xs font-medium">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="mr-0.5">
                  <polyline [attr.points]="card.change >= 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                </svg>
                {{ card.change >= 0 ? '+' : '' }}{{ card.change }}%
              </span>
              <span class="text-[11px] text-gray-400">vs mes anterior</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SummaryCardsComponent {
  readonly summary = input.required<{ totalBalance: number; totalIncome: number; totalExpenses: number; netSavings: number; netWorth: number }>();
  readonly previousSummary = input.required<{ totalBalance: number; totalIncome: number; totalExpenses: number; netSavings: number; netWorth: number }>();

  protected get cards(): CardConfig[] {
    const s = this.summary();
    const p = this.previousSummary();

    return [
      {
        label: 'Patrimonio Neto',
        value: this.fmt(s.netWorth),
        change: this.pct(s.netWorth, p.netWorth),
        icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        accent: '#3B82F6',
      },
      {
        label: 'Ingresos del Mes',
        value: this.fmt(s.totalIncome),
        change: this.pct(s.totalIncome, p.totalIncome),
        icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
        gradient: 'linear-gradient(135deg, #22C55E, #15803D)',
        accent: '#22C55E',
      },
      {
        label: 'Gastos del Mes',
        value: this.fmt(s.totalExpenses),
        change: this.pct(s.totalExpenses, p.totalExpenses),
        icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>`,
        gradient: 'linear-gradient(135deg, #EF4444, #B91C1C)',
        accent: '#EF4444',
      },
      {
        label: 'Ahorro Neto',
        value: this.fmt(s.netSavings),
        change: null,
        icon: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="3" rx="2"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="18" cy="14" r="1"/></svg>`,
        gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
        accent: '#8B5CF6',
      },
    ];
  }

  private fmt(n: number): string {
    return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
  }

  private pct(current: number, previous: number): number {
    if (!previous) { return 0; }
    return Math.round(((current - previous) / previous) * 100);
  }
}
