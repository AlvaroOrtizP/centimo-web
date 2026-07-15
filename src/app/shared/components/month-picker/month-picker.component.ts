import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../core/services/financial-data.service';
import { MONTHS } from '../../../core/constants/date.constants';

@Component({
  selector: 'app-month-picker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ml-1 text-gray-400 flex-shrink-0">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
      </svg>
      <select
        aria-label="Seleccionar mes"
        class="appearance-none bg-transparent px-1 py-1 text-sm font-medium text-gray-700 outline-none"
        [ngModel]="service.currentMonth()"
        (ngModelChange)="service.currentMonth.set($event)"
      >
        @for (m of months; track $index) {
          <option [value]="$index + 1">{{ m }}</option>
        }
      </select>
      <span class="text-gray-300">|</span>
      <select
        aria-label="Seleccionar año"
        class="appearance-none bg-transparent px-1 py-1 text-sm font-medium text-gray-700 outline-none"
        [ngModel]="service.currentYear()"
        (ngModelChange)="service.currentYear.set($event)"
      >
        @for (y of years; track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
    </div>
  `,
})
export class MonthPickerComponent {
  protected readonly service = inject(FinancialDataService);
  protected readonly months = MONTHS;
  protected readonly years = [2026, 2027];
}
