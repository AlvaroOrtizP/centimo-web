import { Component, input } from '@angular/core';

import { IncomeSource } from '../../../../models/income-source';

@Component({
  selector: 'app-income-breakdown',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div class="border-b border-gray-100 px-5 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Ingresos del Mes</h2>
          @if (incomes().length > 0) {
            <span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">{{ incomes().length }}</span>
          }
        </div>
      </div>
      @if (incomes().length === 0) {
        <div class="flex flex-col items-center gap-2 px-5 py-10 text-sm text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
          Sin ingresos registrados
        </div>
      } @else {
        <div class="divide-y divide-gray-100">
          @for (inc of incomes(); track inc.id) {
            <div class="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50/50">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-700">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">{{ inc.description }}</p>
                <p class="text-xs text-gray-500">{{ inc.source }}</p>
              </div>
              <span class="text-sm font-bold text-green-600">+{{ inc.amount.toLocaleString('es-ES') }} €</span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class IncomeBreakdownComponent {
  readonly incomes = input.required<IncomeSource[]>();
}
