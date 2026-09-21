import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MONTH_OPTIONS, YEARS } from '../../core/constants/date.constants';
import { IncomeFormComponent } from '../entry-form/components/income-form/income-form.component';
import { SalaryDistributionComponent } from './components/salary-distribution/salary-distribution.component';
import { SalaryConfigComponent } from './components/salary-config/salary-config.component';
import { CommitmentsComponent } from './components/commitments/commitments.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [FormsModule, IncomeFormComponent, SalaryDistributionComponent, SalaryConfigComponent, CommitmentsComponent, CollapsibleDescriptionComponent],
  template: `
    <div class="space-y-6">
      <app-collapsible-description description="Gestiona la distribución de tu nómina entre plataformas, configura compromisos fijos y compromisos puntuales." storageKey="desc-income" />

      <!-- Tabs -->
      <div class="border-b border-gray-200">
        <nav aria-label="Navegación de ingresos" class="-mb-px flex gap-4 overflow-x-auto sm:gap-6">
          <button
            class="shrink-0 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium text-orange-600 transition-colors"
            [class.border-orange-500]="activeTab() === 'income'"
            [class.text-orange-700]="activeTab() === 'income'"
            [class.border-transparent]="activeTab() !== 'income'"
            (click)="activeTab.set('income')"
          >Distribución Mensual</button>
          <button
            class="shrink-0 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium text-orange-600 transition-colors"
            [class.border-orange-500]="activeTab() === 'config'"
            [class.text-orange-700]="activeTab() === 'config'"
            [class.border-transparent]="activeTab() !== 'config'"
            (click)="activeTab.set('config')"
          >Planificación</button>
          <button
            class="shrink-0 whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium text-orange-600 transition-colors"
            [class.border-orange-500]="activeTab() === 'commitments'"
            [class.text-orange-700]="activeTab() === 'commitments'"
            [class.border-transparent]="activeTab() !== 'commitments'"
            (click)="activeTab.set('commitments')"
          >Compromisos</button>
        </nav>
      </div>

      @if (activeTab() === 'income') {
        <app-collapsible-description description="Registra los ingresos recibidos este mes por cada cuenta y distribuye tu sueldo entre plataformas. Los datos se guardan por mes y año." storageKey="desc-income-tab" />
        <!-- Selector de mes/año global -->
        <div class="flex items-center gap-3">
          <select
            aria-label="Seleccionar mes"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            [(ngModel)]="selectedMonth"
          >
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select
            aria-label="Seleccionar año"
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
        <app-collapsible-description description="Planifica la distribución de tu nómina entre plataformas a futuro. Estos datos se usan para pre-rellenar la distribución mensual." storageKey="desc-income-config" />
        <app-salary-config />
      } @else if (activeTab() === 'commitments') {
        <app-collapsible-description description="Gestiona gastos recurrentes (alquiler, suscripciones, seguros) y compromisos puntuales (impuestos, reparaciones). Se muestran en la vista mensual como parte de la planificación." storageKey="desc-income-commitments" />
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
