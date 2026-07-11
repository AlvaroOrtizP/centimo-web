import { Component, computed, inject } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { IncomeFormComponent } from '../entry-form/components/income-form/income-form.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [IncomeFormComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Nómina</h1>
        <p class="text-sm text-gray-500">Registra tus ingresos del mes</p>
      </div>
      <app-income-form [accounts]="accounts()" />
    </div>
  `,
})
export class IncomeComponent {
  private readonly service = inject(FinancialDataService);
  protected readonly accounts = computed(() => this.service.accounts());
}
