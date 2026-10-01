import { Component, input, output } from '@angular/core';

import { UrbanitaeBalance } from '../../../../models';
import { MONTHS } from '../../../../core/constants/date.constants';

@Component({
  selector: 'app-urbanitae-history-table',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-500">Historial de balances</p>
        <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{{ balances().length }} registros</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="px-4 py-3">Mes</th>
              <th class="px-4 py-3 text-right">Balance</th>
              <th class="px-4 py-3 text-right">Aportación</th>
              <th class="px-4 py-3 text-right">Dinero total</th>
              <th class="px-4 py-3 text-right">Hacienda</th>
              <th class="px-4 py-3 text-right">Dinero final</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (balances().length === 0) {
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-400">Sin registros todavía. Guarda un balance para este mes.</td>
              </tr>
            } @else {
              @for (b of balances(); track b.id) {
                <tr class="transition-all duration-150 hover:bg-gray-50/80">
                  <td class="px-4 py-3 font-semibold text-gray-900">{{ formatMes(b.mes) }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ b.balanceMensual.toLocaleString('es-ES') }} €</td>
                  <td class="px-4 py-3 text-right text-gray-500">{{ b.aporteMensual ?? '-' }}</td>
                  <td class="px-4 py-3 text-right font-medium text-emerald-600">{{ b.dineroTotal ?? '-' }}</td>
                  <td class="px-4 py-3 text-right font-medium text-amber-600">{{ b.dineroHacienda ?? '-' }}</td>
                  <td class="px-4 py-3 text-right font-medium text-emerald-700">{{ b.dineroFinal ?? '-' }}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        (click)="edit.emit(b)"
                        title="Editar registro"
                        aria-label="Editar registro"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                        </svg>
                      </button>
                      <button
                        class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        (click)="delete.emit(b.id)"
                        title="Eliminar registro"
                        aria-label="Eliminar registro"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UrbanitaeHistoryTableComponent {
  readonly balances = input.required<UrbanitaeBalance[]>();

  readonly edit = output<UrbanitaeBalance>();
  readonly delete = output<string>();

  formatMes(mes: string): string {
    const [year, month] = mes.split('-').map(Number);
    return `${MONTHS[(month ?? 1) - 1]} ${year}`;
  }
}