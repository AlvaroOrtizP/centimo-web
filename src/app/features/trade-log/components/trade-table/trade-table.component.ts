import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';

import { InvestmentTransaction } from '../../../../models/investment-transaction';

@Component({
  selector: 'app-trade-table',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="whitespace-nowrap px-4 py-3.5">Activo</th>
              <th class="whitespace-nowrap px-4 py-3.5">Tipo</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Fecha Compra</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Cantidad</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Precio Compra</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Total Invertido</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Fecha Venta</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Precio Venta</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">Total Recibido</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">P&L</th>
              <th class="whitespace-nowrap px-4 py-3.5 text-right">ROI</th>
              <th class="whitespace-nowrap px-4 py-3.5"><span class="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (trade of trades(); track trade.id) {
              <tr [ngClass]="{'bg-green-50/50': trade.pnl != null && trade.pnl > 0, 'bg-red-50/50': trade.pnl != null && trade.pnl < 0}" class="transition-all duration-150 hover:bg-gray-50/80">
                <td class="whitespace-nowrap px-4 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-2 rounded-full" [class.bg-green-500]="trade.status === 'open'" [class.bg-gray-400]="trade.status === 'closed'"></div>
                    <span class="font-medium text-gray-900">{{ trade.assetName }}</span>
                  </div>
                </td>
                <td class="whitespace-nowrap px-4 py-3.5">
                  <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold" [class.bg-emerald-100]="trade.type === 'buy'" [class.text-emerald-800]="trade.type === 'buy'" [class.bg-red-100]="trade.type === 'sell'" [class.text-red-800]="trade.type === 'sell'">
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline [attr.points]="trade.type === 'buy' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                    </svg>
                    {{ trade.type === 'buy' ? 'COMPRA' : 'VENTA' }}
                  </span>
                </td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">{{ trade.buyDate }}</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">{{ trade.buyQuantity }}</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">{{ trade.buyPricePerUnit.toLocaleString('es-ES') }} €</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-gray-900">{{ trade.buyTotalCost.toLocaleString('es-ES') }} €</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">{{ trade.sellDate || '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">{{ trade.sellPricePerUnit != null ? trade.sellPricePerUnit.toLocaleString('es-ES') + ' €' : '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right text-gray-600">{{ trade.sellTotalReceived != null ? trade.sellTotalReceived.toLocaleString('es-ES') + ' €' : '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right font-semibold" [class.text-emerald-600]="trade.pnl != null && trade.pnl >= 0" [class.text-red-600]="trade.pnl != null && trade.pnl < 0">{{ trade.pnl != null ? (trade.pnl >= 0 ? '+' : '') + trade.pnl.toLocaleString('es-ES') + ' €' : '—' }}</td>
                <td class="whitespace-nowrap px-4 py-3.5 text-right font-semibold" [class.text-emerald-600]="trade.pnl != null && trade.pnl >= 0" [class.text-red-600]="trade.pnl != null && trade.pnl < 0">{{ roiDisplay(trade) }}</td>
                <td class="whitespace-nowrap px-4 py-3.5">
                  <button
                    class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    (click)="delete.emit(trade.id)"
                    title="Eliminar operación"
                    aria-label="Eliminar operación"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (trades().length === 0) {
        <div class="flex flex-col items-center gap-2 py-12 text-sm text-gray-400">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
            <line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          No se encontraron operaciones
        </div>
      }
    </div>
  `,
})
export class TradeTableComponent {
  readonly trades = input.required<InvestmentTransaction[]>();
  readonly delete = output<string>();

  protected roiDisplay(trade: InvestmentTransaction): string {
    if (trade.pnl == null || trade.buyTotalCost === 0) { return '—'; }
    const pct = (trade.pnl / trade.buyTotalCost) * 100;
    return pct.toFixed(1) + '%';
  }
}
