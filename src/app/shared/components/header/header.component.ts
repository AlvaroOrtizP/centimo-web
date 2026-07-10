import { Component, inject, output } from '@angular/core';

import { MonthPickerComponent } from '../month-picker/month-picker.component';
import { FinancialDataService } from '../../../core/services/financial-data.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MonthPickerComponent],
  template: `
    <header class="flex items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 py-3 lg:px-6 shadow-sm">
      <div class="flex items-center gap-3">
        <button
          class="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 lg:hidden"
          (click)="menuClick.emit()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div class="flex items-center gap-3">
          <div class="hidden h-6 w-0.5 bg-gray-200 lg:block"></div>
          <h1 class="text-lg font-semibold text-gray-900">{{ title }}</h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <app-month-picker />
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly menuClick = output<void>();

  private readonly service = inject(FinancialDataService);

  protected get title(): string {
    return 'Centimo - Control Financiero';
  }
}
