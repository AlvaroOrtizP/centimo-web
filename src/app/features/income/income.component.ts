import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS } from '../../core/constants/date.constants';
import { IncomeFormComponent } from '../entry-form/components/income-form/income-form.component';
import { SalaryDistributionComponent } from './components/salary-distribution/salary-distribution.component';
import { SalaryConfigComponent } from './components/salary-config/salary-config.component';
import { CommitmentsComponent } from './components/commitments/commitments.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [FormsModule, IncomeFormComponent, SalaryDistributionComponent, SalaryConfigComponent, CommitmentsComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Nómina</h1>
        <p class="text-sm text-gray-500">Registra tus ingresos y distribuye tu sueldo</p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex gap-6">
          <button
            class="border-b-2 px-1 py-2 text-sm font-medium transition-colors"
            [class.border-green-600]="activeTab() === 'income'"
            [class.text-green-600]="activeTab() === 'income'"
            [class.border-transparent]="activeTab() !== 'income'"
            [class.text-gray-500]="activeTab() !== 'income'"
            [class.hover:border-gray-300]="activeTab() !== 'income'"
            [class.hover:text-gray-700]="activeTab() !== 'income'"
            (click)="activeTab.set('income')"
          >Distribución Mensual</button>
          <button
            class="border-b-2 px-1 py-2 text-sm font-medium transition-colors"
            [class.border-green-600]="activeTab() === 'config'"
            [class.text-green-600]="activeTab() === 'config'"
            [class.border-transparent]="activeTab() !== 'config'"
            [class.text-gray-500]="activeTab() !== 'config'"
            [class.hover:border-gray-300]="activeTab() !== 'config'"
            [class.hover:text-gray-700]="activeTab() !== 'config'"
            (click)="activeTab.set('config')"
          >Configuración</button>
          <button
            class="border-b-2 px-1 py-2 text-sm font-medium transition-colors"
            [class.border-green-600]="activeTab() === 'commitments'"
            [class.text-green-600]="activeTab() === 'commitments'"
            [class.border-transparent]="activeTab() !== 'commitments'"
            [class.text-gray-500]="activeTab() !== 'commitments'"
            [class.hover:border-gray-300]="activeTab() !== 'commitments'"
            [class.hover:text-gray-700]="activeTab() !== 'commitments'"
            (click)="activeTab.set('commitments')"
          >Compromisos</button>
        </nav>
      </div>

      @if (activeTab() === 'income') {
        <!-- Selector de mes/año global -->
        <div class="flex items-center gap-3">
          <select
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            [(ngModel)]="selectedMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            [(ngModel)]="selectedYear"
          >
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
        </div>

        <!-- Ingresos y Distribución en la misma pantalla -->
        <div class="grid gap-6 lg:grid-cols-2">
          <app-income-form [accounts]="accounts()" [month]="selectedMonth()" [year]="selectedYear()" />
          <app-salary-distribution [month]="selectedMonth()" [year]="selectedYear()" />
        </div>
      } @else if (activeTab() === 'config') {
        <app-salary-config />
      } @else {
        <app-commitments />
      }
    </div>
  `,
})
export class IncomeComponent {
  private readonly service = inject(FinancialDataService);

  protected readonly accounts = computed(() => this.service.accounts());

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = YEARS;

  protected readonly selectedMonth = signal(this.service.currentMonth());
  protected readonly selectedYear = signal(this.service.currentYear());

  protected readonly activeTab = signal<'income' | 'config' | 'commitments'>('income');
}
