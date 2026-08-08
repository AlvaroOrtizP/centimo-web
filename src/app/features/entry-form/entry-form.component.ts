import { Component, inject, computed, signal } from '@angular/core';

import { FinancialDataService } from '../../core/services/financial-data.service';
import { MonthPickerComponent } from '../../shared/components/month-picker/month-picker.component';
import { CrowdlendingFormComponent } from './components/crowdlending-form/crowdlending-form.component';
import { MintosFormComponent } from './components/mintos-form/mintos-form.component';
import { EquitoFormComponent } from './components/equito-form/equito-form.component';
import { UrbanitaeFormComponent } from './components/urbanitae-form/urbanitae-form.component';
import { RevolutFormComponent } from './components/revolut-form/revolut-form.component';
import { B100FormComponent } from './components/b100-form/b100-form.component';
import { BanksFormComponent } from './components/banks-form/banks-form.component';
import { MyInvestorFormComponent } from './components/myinvestor-form/myinvestor-form.component';
import { CollapsibleDescriptionComponent } from '../../shared/components/collapsible-description/collapsible-description.component';

type Tab = 'banks' | 'revolut' | 'b100' | 'myinvestor' | 'mintos' | 'equito' | 'urbanitae';

interface TabConfig {
  key: Tab;
  label: string;
  color: string;
  done?: boolean;
}

@Component({
  selector: 'app-entry-form',
  standalone: true,
  imports: [
    MonthPickerComponent, CollapsibleDescriptionComponent,
    CrowdlendingFormComponent, MintosFormComponent, EquitoFormComponent, UrbanitaeFormComponent, RevolutFormComponent, B100FormComponent, BanksFormComponent, MyInvestorFormComponent,
  ],
  template: `
    <div class="space-y-6">
      <app-collapsible-description description="Formulario para registrar saldos en cada plataforma." storageKey="desc-entry" />

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
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    [style.color]="activeTab() === tab.key ? '#fff' : tab.color"
                  >
                    @if (tab.key === 'banks') {
                      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                    } @else if (tab.key === 'revolut') {
                      <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
                    } @else if (tab.key === 'b100') {
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    } @else if (tab.key === 'myinvestor') {
                      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2"/><circle cx="17" cy="17" r="1"/>
                    } @else if (tab.key === 'mintos') {
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                    } @else if (tab.key === 'equito') {
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    } @else {
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    }
                  </svg>
                </span>
                {{ tab.label }}
                @if (tab.done) {
                  <span aria-hidden="true" class="pointer-events-none absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-green-500"></span>
                }
              </button>
            }
          </div>
        </div>
        <div class="h-0.5" [style.background-color]="activeTabColor()"></div>
        <div class="p-5">
          @switch (activeTab()) {
            @case ('banks') {
              <app-collapsible-description description="Actualiza el saldo y los ingresos de las cuentas bancarias (BBVA, CaixaBank) para el mes seleccionado. Estos datos alimentan el resumen del Dashboard." storageKey="desc-entry-banks" />
              <app-banks-form [accounts]="allAccounts()" />
            }
            @case ('revolut') {
              <app-collapsible-description description="Registra el saldo de tus cuentas Revolut (principal, ahorro, metal) y los ingresos generados este mes." storageKey="desc-entry-revolut" />
              <app-revolut-form [accounts]="allAccounts()" />
            }
            @case ('b100') {
              <app-collapsible-description description="Actualiza saldos e intereses de tus cuentas B100 (corriente, ahorro, inversión). Los intereses se suman automáticamente al balance." storageKey="desc-entry-b100" />
              <app-b100-form [accounts]="allAccounts()" />
            }
            @case ('myinvestor') {
              <app-collapsible-description description="Registra saldos de cuentas MyInvestor y actualiza el valor de tus fondos indexados. Los balances de fondos se muestran en el gráfico de evolución." storageKey="desc-entry-myinvestor" />
              <app-myinvestor-form [accounts]="allAccounts()" />
            }
            @case ('mintos') {
              <app-collapsible-description description="Registra el saldo y los intereses devengados en Mintos este mes. Los datos se reflejan en el resumen de inversiones fijas." storageKey="desc-entry-mintos" />
              <app-mintos-form [accounts]="allAccounts()" />
            }
            @case ('equito') {
              <app-collapsible-description description="Registra el saldo e intereses de tus préstamos en Equito. Los intereses se suman al balance de la plataforma." storageKey="desc-entry-equito" />
              <app-equito-form [accounts]="allAccounts()" />
            }
            @case ('urbanitae') {
              <app-collapsible-description description="Registra el saldo e intereses de tus inversiones en Urbanitae (crowdlending inmobiliario). Los datos se reflejan en el resumen de inversiones fijas." storageKey="desc-entry-urbanitae" />
              <app-urbanitae-form />
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class EntryFormComponent {
  protected readonly service = inject(FinancialDataService);
  protected readonly activeTab = signal<Tab>('banks');

  protected readonly tabs: TabConfig[] = [
    { key: 'banks', label: 'Bancos', color: '#004481', done: true },
    { key: 'revolut', label: 'Revolut', color: '#EB008B', done: true },
    { key: 'b100', label: 'B100', color: '#6C3FD1', done: true },
    { key: 'myinvestor', label: 'MyInvestor', color: '#00A3E0', done: true },
    { key: 'mintos', label: 'Mintos', color: '#00BFA5', done: true },
    { key: 'equito', label: 'Equito', color: '#FF6B35', done: true },
    { key: 'urbanitae', label: 'Urbanitae', color: '#E63946', done: true },
  ];

  protected readonly activeTabColor = computed(() => {
    const tab = this.tabs.find(t => t.key === this.activeTab());
    return tab?.color ?? '#6b7280';
  });

  protected readonly allAccounts = computed(() => this.service.accounts());
}
