import { Component, input } from '@angular/core';

export interface TradeTotals {
  totalInvested: number;
  totalWithdrawn: number;
  globalPnl: number;
  platformPnl: { name: string; color: string; pnl: number }[];
}

@Component({
  selector: 'app-trade-summary',
  standalone: true,
  template: `
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-blue-400/10 to-blue-600/10 transition-all duration-300 group-hover:opacity-80"></div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Total Invertido</p>
        <p class="mt-1.5 text-2xl font-bold text-gray-900">{{ totals().totalInvested.toLocaleString('es-ES') }} €</p>
      </div>
      <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-amber-400/10 to-amber-600/10 transition-all duration-300 group-hover:opacity-80"></div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Total Retirado</p>
        <p class="mt-1.5 text-2xl font-bold text-gray-900">{{ totals().totalWithdrawn.toLocaleString('es-ES') }} €</p>
      </div>
      <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-purple-400/10 to-purple-600/10 transition-all duration-300 group-hover:opacity-80"></div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">P&L Global</p>
        <p class="mt-1.5 text-2xl font-bold" [class.text-emerald-600]="totals().globalPnl >= 0" [class.text-red-600]="totals().globalPnl < 0">
          {{ totals().globalPnl >= 0 ? '+' : '' }}{{ totals().globalPnl.toLocaleString('es-ES') }} €
        </p>
      </div>
      <div class="group relative overflow-hidden rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div class="absolute right-0 top-0 h-20 w-20 translate-x-5 -translate-y-5 rounded-full bg-gradient-to-br from-pink-400/10 to-pink-600/10 transition-all duration-300 group-hover:opacity-80"></div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">P&L por Plataforma</p>
        <div class="mt-2 space-y-1.5">
          @for (item of totals().platformPnl; track item.name) {
            <div class="flex items-center gap-2 text-sm">
              <span class="h-2 w-2 rounded-full" [style.background-color]="item.color"></span>
              <span class="text-gray-600">{{ item.name }}</span>
              <span class="ml-auto font-semibold" [class.text-emerald-600]="item.pnl >= 0" [class.text-red-600]="item.pnl < 0">
                {{ item.pnl >= 0 ? '+' : '' }}{{ item.pnl.toLocaleString('es-ES') }} €
              </span>
            </div>
          }
        </div>
        @if (totals().platformPnl.length === 0) {
          <p class="mt-2 text-xs text-gray-400">Sin datos</p>
        }
      </div>
    </div>
  `,
})
export class TradeSummaryComponent {
  readonly totals = input.required<TradeTotals>();
}
