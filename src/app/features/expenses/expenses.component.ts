import { Component, computed, inject } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';
import { ExpenseFormComponent } from '../entry-form/components/expense-form/expense-form.component';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [MonthPickerComponent, CollapsibleDescriptionComponent, ExpenseFormComponent],
  template: `
    <div class="space-y-6">
      <app-collapsible-description description="Registra los gastos del mes por categoría: alimentación, transporte, suscripciones, etc. Se asignan a una cuenta y se reflejan en el resumen mensual." storageKey="desc-expenses" />

      <div class="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Período</label>
            <div class="mt-1.5">
              <app-month-picker />
            </div>
          </div>
        </div>
      </div>

      <app-expense-form [year]="selectedYear()" [month]="selectedMonth()" />
    </div>
  `,
})
export class ExpensesComponent {
  private readonly service = inject(FinancialDataService);

  protected readonly selectedYear = computed(() => this.service.currentYear());
  protected readonly selectedMonth = computed(() => this.service.currentMonth());
}
