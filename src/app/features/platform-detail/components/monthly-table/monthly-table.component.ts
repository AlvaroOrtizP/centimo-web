import { Component, input } from '@angular/core';

import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { MONTHS } from '../../../../core/constants/date.constants';

@Component({
  selector: 'app-monthly-table',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div class="border-b border-gray-100 px-5 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Historial Mensual</h2>
          <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{{ snapshots().length }} meses</span>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="px-5 py-3.5">Mes</th>
              <th class="px-5 py-3.5 text-right">Balance</th>
              <th class="px-5 py-3.5 text-right">Ingresos</th>
              <th class="px-5 py-3.5 text-right">Gastos</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (snap of snapshots(); track snap.id) {
              <tr class="transition-all duration-150 hover:bg-gray-50/80">
                <td class="px-5 py-3.5 font-semibold text-gray-900">{{ MONTHS[snap.month - 1] }} {{ snap.year }}</td>
                <td class="px-5 py-3.5 text-right font-semibold text-gray-900">{{ snap.balance.toLocaleString('es-ES') }} €</td>
                <td class="px-5 py-3.5 text-right font-medium text-emerald-600">{{ snap.income > 0 ? '+' + snap.income.toLocaleString('es-ES') : '-' }}</td>
                <td class="px-5 py-3.5 text-right font-medium text-red-600">{{ snap.expenses > 0 ? snap.expenses.toLocaleString('es-ES') + ' €' : '-' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (snapshots().length === 0) {
        <div class="py-10 text-center text-sm text-gray-400">Sin datos disponibles</div>
      }
    </div>
  `,
})
export class MonthlyTableComponent {
  readonly snapshots = input.required<MonthlySnapshot[]>();

  protected readonly MONTHS = MONTHS;
}
