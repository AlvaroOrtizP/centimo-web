import { Component, inject, input, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PlatformType } from '../../models/platform-type';
import { FinancialDataService } from '../../core/services/financial-data.service';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';
import { IncomeFormComponent } from './components/income-form/income-form.component';
import { ExpenseFormComponent } from './components/expense-form/expense-form.component';
import { TradeFormComponent } from './components/trade-form/trade-form.component';
import { MonthlyCloseFormComponent } from './components/monthly-close-form/monthly-close-form.component';
import { ProjectsFormComponent } from './components/projects-form/projects-form.component';
import { CrowdlendingFormComponent } from './components/crowdlending-form/crowdlending-form.component';

type Tab = 'income' | 'expenses' | 'trades' | 'mintos' | 'equito' | 'urbanitae' | 'close' | 'projects';

interface TabConfig {
  key: Tab;
  label: string;
  color: string;
}

@Component({
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    FormsModule, MonthPickerComponent,
    IncomeFormComponent, ExpenseFormComponent, TradeFormComponent,
    MonthlyCloseFormComponent, ProjectsFormComponent, CrowdlendingFormComponent,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-bold text-gray-900">Entrada de Datos</h1>
        <p class="text-sm text-gray-500">Registra tus finanzas del mes</p>
      </div>

      <div class="rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <div class="flex flex-wrap items-end gap-4">
          @if (!platformId()) {
            <div class="flex-1 min-w-[200px]">
              <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Plataforma</label>
              <div class="mt-1.5 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 flex-shrink-0">
                  <rect width="18" height="14" x="3" y="3" rx="2"/><line x1="3" x2="21" y1="10" y2="10"/>
                </svg>
                <select
                  class="flex-1 appearance-none bg-transparent text-sm text-gray-700 outline-none"
                  [(ngModel)]="selectedPlatformId"
                >
                  <option value="">Seleccionar plataforma</option>
                  @for (p of service.platforms(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
            </div>
          }
          <div [class.flex-1]="!!platformId()">
            <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Período</label>
            <div class="mt-1.5">
              <app-month-picker />
            </div>
          </div>
          @if (platform(); as p) {
            <div class="flex items-center gap-3 ml-auto pl-4 border-l border-gray-100">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm" [style.background-color]="p.color + '15'">
                <span class="h-4 w-4 rounded-full" [style.background-color]="p.color"></span>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-gray-900">{{ p.name }}</div>
                <div class="text-xs text-gray-400">{{ selectedYear() }} / {{ selectedMonth() }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      @if (platform(); as p) {
        <div class="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
          <div class="bg-gray-50/60 px-4 pt-3">
            <div class="flex gap-1">
              @for (tab of tabs(); track tab.key) {
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
                      } @else if (tab.key === 'close') {
                        <path d="M21 12a9 9 0 1 1-9-9"/><polyline points="22 4 12 14.01 9 11.01"/>
                      } @else {
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
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
                <app-income-form [accounts]="accounts()" [year]="selectedYear()" [month]="selectedMonth()" />
              }
              @case ('expenses') {
                <app-expense-form [accounts]="accounts()" [year]="selectedYear()" [month]="selectedMonth()" />
              }
              @case ('trades') {
                <app-trade-form [accounts]="accounts()" />
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
                <app-monthly-close-form [accounts]="accounts()" [year]="selectedYear()" [month]="selectedMonth()" />
              }
              @case ('projects') {
                <app-projects-form [accounts]="accounts()" [year]="selectedYear()" [month]="selectedMonth()" />
              }
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class EntryFormComponent {
  readonly platformId = input<string>('');

  protected readonly service = inject(FinancialDataService);
  protected readonly selectedPlatformId = signal('');
  protected readonly activeTab = signal<Tab>('income');

  protected readonly tabs = computed<TabConfig[]>(() => {
    const base: TabConfig[] = [
      { key: 'income', label: 'Nómina', color: '#059669' },
      { key: 'expenses', label: 'Gastos', color: '#dc2626' },
      { key: 'trades', label: 'Trades', color: '#7c3aed' },
      { key: 'mintos', label: 'Mintos', color: '#00BFA5' },
      { key: 'equito', label: 'Equito', color: '#FF6B35' },
      { key: 'urbanitae', label: 'Urbanitae', color: '#E63946' },
    ];

    const p = this.platform();
    if (p?.type === PlatformType.Crowdlending) {
      base.push({ key: 'projects', label: p.name, color: p.color });
    }

    base.push({ key: 'close', label: 'Cierre', color: '#0891b2' });
    return base;
  });

  protected readonly activeTabColor = computed(() => {
    const tab = this.tabs().find(t => t.key === this.activeTab());
    return tab?.color ?? '#6b7280';
  });

  private readonly effectivePlatformId = computed(() =>
    this.platformId() || this.selectedPlatformId()
  );

  protected readonly selectedYear = computed(() => this.service.currentYear());
  protected readonly selectedMonth = computed(() => this.service.currentMonth());

  protected readonly platform = computed(() =>
    this.service.getPlatform(this.effectivePlatformId())
  );

  protected readonly accounts = computed(() =>
    this.service.getAccountsByPlatform(this.effectivePlatformId())
  );
}
