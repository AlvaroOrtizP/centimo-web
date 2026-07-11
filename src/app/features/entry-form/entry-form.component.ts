import { Component, inject, computed, signal } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';
import { IncomeFormComponent } from './components/income-form/income-form.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { TradeFormComponent } from './components/trade-form/trade-form.component';
import { MonthlyCloseFormComponent } from './components/monthly-close-form/monthly-close-form.component';
import { CrowdlendingFormComponent } from './components/crowdlending-form/crowdlending-form.component';

type Tab = 'income' | 'expenses' | 'trades' | 'mintos' | 'equito' | 'urbanitae' | 'close';

interface TabConfig {
  key: Tab;
  label: string;
  color: string;
}

@Component({
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    MonthPickerComponent,
    IncomeFormComponent, ExpenseFormComponent, TradeFormComponent,
    MonthlyCloseFormComponent, CrowdlendingFormComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Entrada de Datos</h1>
        <p class="text-sm text-gray-500">Registra tus finanzas del mes</p>
      </div>

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

      <div class="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
        <div class="bg-gray-50/60 px-4 pt-3">
          <div class="flex gap-1">
            @for (tab of tabs; track tab.key) {
              <button
                class="relative flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
                [style.background-color]="activeTab() === tab.key ? tab.color : 'transparent'"
                [class.text-white]="activeTab() === tab.key"
                [class.text-gray-500]="activeTab() !== tab.key"
                [class.hover:text-gray-700]="activeTab() !== tab.key"
                [class.hover:bg-gray-100]="activeTab() !== tab.key"
                [class.shadow-sm]="activeTab() === tab.key"
                (click)="activeTab.set(tab.key)"
              >
                <span
                  class="flex h-5 w-5 items-center justify-center rounded-full"
                  [style.background-color]="activeTab() === tab.key ? 'rgba(255,255,255,0.25)' : tab.color + '20'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    [style.color]="activeTab() === tab.key ? '#fff' : tab.color"
                  >
                    @if (tab.key === 'income') {
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    } @else if (tab.key === 'expenses') {
                      <path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    } @else if (tab.key === 'trades') {
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    } @else if (tab.key === 'mintos') {
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                    } @else if (tab.key === 'equito') {
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    } @else if (tab.key === 'urbanitae') {
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    } @else {
                      <path d="M21 12a9 9 0 1 1-9-9"/><polyline points="22 4 12 14.01 9 11.01"/>
                    }
                  </svg>
                </span>
                {{ tab.label }}
              </button>
            }
          </div>
        </div>
        <div class="h-0.5" [style.background-color]="activeTabColor()"></div>
        <div class="p-5">
          @switch (activeTab()) {
            @case ('income') {
              <app-income-form [accounts]="allAccounts()" [year]="selectedYear()" [month]="selectedMonth()" />
            }
            @case ('expenses') {
              <app-expense-form [accounts]="allAccounts()" [year]="selectedYear()" [month]="selectedMonth()" />
            }
            @case ('trades') {
              <app-trade-form [accounts]="allAccounts()" />
            }
            @case ('mintos') {
              <app-crowdlending-form platformId="mintos" />
            }
            @case ('equito') {
              <app-crowdlending-form platformId="equito" />
            }
            @case ('urbanitae') {
              <app-crowdlending-form platformId="urbanitae" />
            }
            @case ('close') {
              <app-monthly-close-form [accounts]="allAccounts()" [year]="selectedYear()" [month]="selectedMonth()" />
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class EntryFormComponent {
  protected readonly service = inject(FinancialDataService);
  protected readonly activeTab = signal<Tab>('income');

  protected readonly tabs: TabConfig[] = [
    { key: 'income', label: 'Nómina', color: '#059669' },
    { key: 'expenses', label: 'Gastos', color: '#dc2626' },
    { key: 'trades', label: 'Trades', color: '#7c3aed' },
    { key: 'mintos', label: 'Mintos', color: '#00BFA5' },
    { key: 'equito', label: 'Equito', color: '#FF6B35' },
    { key: 'urbanitae', label: 'Urbanitae', color: '#E63946' },
    { key: 'close', label: 'Cierre', color: '#0891b2' },
  ];

  protected readonly activeTabColor = computed(() => {
    const tab = this.tabs.find(t => t.key === this.activeTab());
    return tab?.color ?? '#6b7280';
  });

  protected readonly selectedYear = computed(() => this.service.currentYear());
  protected readonly selectedMonth = computed(() => this.service.currentMonth());

  protected readonly allAccounts = computed(() => this.service.accounts());
}
