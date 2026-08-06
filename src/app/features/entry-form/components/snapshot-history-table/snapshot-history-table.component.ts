import { Component, input, output } from '@angular/core';

import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { MONTHS } from '../../../../core/constants/date.constants';

@Component({
  selector: 'app-snapshot-history-table',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <p
          class="group relative text-xs font-medium uppercase tracking-wider text-gray-500"
          [class.cursor-help]="headingTooltip() !== undefined"
        >
          Historial de balances
          @if (headingTooltip()) {
            <span class="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-normal normal-case tracking-normal text-white shadow-lg group-hover:block">
              {{ headingTooltip() }}
            </span>
          }
        </p>
        <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{{ snapshots().length }} registros</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <th class="px-4 py-3">Mes</th>
              <th class="px-4 py-3 text-right">Balance</th>
              <th class="px-4 py-3 text-right">Ingresos</th>
              <th class="px-4 py-3 text-right">Retiradas</th>
              <th class="px-4 py-3 text-right">Aportación</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @if (snapshots().length === 0) {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">Sin registros todavía. Guarda un balance para este mes.</td>
              </tr>
            } @else {
              @for (snap of snapshots(); track snap.id) {
                <tr class="transition-all duration-150 hover:bg-gray-50/80">
                  <td class="px-4 py-3 font-semibold text-gray-900">{{ MONTHS[snap.month - 1] }} {{ snap.year }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ snap.balance.toLocaleString('es-ES') }} €</td>
                  <td class="px-4 py-3 text-right font-medium text-emerald-600">{{ snap.income > 0 ? '+' + snap.income.toLocaleString('es-ES') : '-' }}</td>
                  <td class="px-4 py-3 text-right font-medium text-red-600">{{ snap.expenses > 0 ? snap.expenses.toLocaleString('es-ES') + ' €' : '-' }}</td>
                  <td class="px-4 py-3 text-right text-gray-500">{{ snap.contribution ? snap.contribution.toLocaleString('es-ES') + ' €' : '-' }}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        (click)="edit.emit(snap)"
                        title="Editar registro"
                        aria-label="Editar registro"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                        </svg>
                      </button>
                      <button
                        class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        (click)="delete.emit(snap.id)"
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
export class SnapshotHistoryTableComponent {
  readonly snapshots = input.required<MonthlySnapshot[]>();

  readonly headingTooltip = input<string | undefined>();

  readonly edit = output<MonthlySnapshot>();
  readonly delete = output<string>();

  protected readonly MONTHS = MONTHS;
}
