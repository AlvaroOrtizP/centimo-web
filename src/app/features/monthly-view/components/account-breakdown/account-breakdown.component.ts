import { Component, computed, inject, input } from '@angular/core';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { DASHBOARD_ENTITY_COLORS, DASHBOARD_ENTITY_NAMES } from '../../../../core/constants/dashboard.constants';
import { B100Subcuenta } from '../../../../models';

interface Subcuenta {
  id: string;
  nombre: string;
  balance: number;
  aporte?: number;
}

interface Entidad {
  codigo: string;
  nombre: string;
  color: string;
  total: number;
  subcuentas: Subcuenta[];
}

const BANCO_ENTIDADES: Record<string, string> = { bbva: 'bbva', caixabank: 'caixa' };

const ENTIDADES: string[] = [
  'revolut', 'bbva', 'caixabank', 'b100',
  'equito', 'urbanitae', 'mintos', 'myinvestor',
];

const B100_SUBCUENTAS: { tipo: B100Subcuenta; nombre: string }[] = [
  { tipo: 'save', nombre: 'Cuenta Save' },
  { tipo: 'health', nombre: 'Cuenta Health' },
];

@Component({
  selector: 'app-account-breakdown',
  standalone: true,
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div class="border-b border-gray-100 px-5 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Desglose por Cuenta</h2>
          <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{{ entidades().length }} entidades</span>
        </div>
      </div>
      <div class="divide-y divide-gray-100">
        @for (entidad of entidades(); track entidad.codigo) {
          <div class="px-5 py-4 transition-colors hover:bg-gray-50/50">
            <div class="flex items-center gap-3">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg" [style.background-color]="entidad.color + '15'">
                <span class="h-2.5 w-2.5 rounded-full" [style.background-color]="entidad.color"></span>
              </div>
              <span class="text-sm font-semibold text-gray-900">{{ entidad.nombre }}</span>
              <span class="ml-auto text-sm font-semibold text-gray-900">
                {{ entidad.total.toLocaleString('es-ES') }} €
              </span>
            </div>
            <div class="mt-2 space-y-0.5 pl-10">
              @for (sub of entidad.subcuentas; track sub.id) {
                <div class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm">
                  <span class="flex-1 truncate text-gray-700">{{ sub.nombre }}</span>
                  <span class="w-24 text-right font-semibold text-gray-900">{{ sub.balance.toLocaleString('es-ES') }} €</span>
                  <span class="w-20 text-right text-xs text-cyan-600">{{ sub.aporte ? '+' + sub.aporte.toLocaleString('es-ES') + '€' : '-' }}</span>
                </div>
              }
            </div>
          </div>
        } @empty {
          <p class="px-5 py-10 text-center text-sm text-gray-400">Sin balances registrados para este mes</p>
        }
      </div>
    </div>
  `,
})
export class AccountBreakdownComponent {
  private readonly service = inject(FinancialDataService);

  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected readonly entidades = computed<Entidad[]>(() => {
    const year = this.year();
    const month = this.month();

    return ENTIDADES
      .map(codigo => this.buildEntidad(codigo, year, month))
      .filter((entidad): entidad is Entidad => entidad !== null);
  });

  private buildEntidad(codigo: string, year: number, month: number): Entidad | null {
    const subcuentas = this.subcuentas(codigo, year, month);
    if (subcuentas.length === 0) { return null; }

    return {
      codigo,
      nombre: DASHBOARD_ENTITY_NAMES[codigo] ?? codigo,
      color: DASHBOARD_ENTITY_COLORS[codigo] ?? '#6B7280',
      total: subcuentas.reduce((sum, s) => sum + s.balance, 0),
      subcuentas,
    };
  }

  private subcuentas(codigo: string, year: number, month: number): Subcuenta[] {
    switch (codigo) {
      case 'revolut': {
        const balance = this.service.getRevolutBalance(year, month);
        return balance ? [this.fila('revolut', 'Revolut', balance.balanceMensual, balance.aporteMensual)] : [];
      }
      case 'bbva':
      case 'caixabank': {
        const entidad = BANCO_ENTIDADES[codigo];
        const balance = this.service.getBancoBalance(entidad, year, month);
        return [this.fila(entidad, DASHBOARD_ENTITY_NAMES[codigo] ?? entidad, balance?.balanceMensual ?? 0, balance?.aporteMensual)];
      }
      case 'b100':
        return B100_SUBCUENTAS.map(({ tipo, nombre }) => {
          const balance = this.service.getB100Balance(tipo, year, month);
          return this.fila(tipo, nombre, balance?.balanceMensual ?? 0, balance?.aporteMensual);
        });
      case 'equito': {
        const balance = this.service.getEquitoBalance(year, month);
        return balance ? [this.fila('equito', 'Equito', balance.balanceMensual, balance.aporteMensual)] : [];
      }
      case 'urbanitae': {
        const balance = this.service.getUrbanitaeBalance(year, month);
        return balance ? [this.fila('urbanitae', 'Urbanitae', balance.balanceMensual, balance.aporteMensual)] : [];
      }
      case 'mintos': {
        const balance = this.service.getMintosBalance(year, month);
        return balance ? [this.fila('mintos', 'Mintos', balance.valorFinal, balance.importeAnadido)] : [];
      }
      case 'myinvestor':
        return this.service.getFundBalancesByMonth(year, month).map(fund => this.fila(
          fund.fundId,
          this.service.myInvestorFunds().find(f => f.id === fund.fundId)?.name ?? fund.fundId,
          fund.balance ?? 0,
          fund.contribution,
        ));
      default:
        return [];
    }
  }

  private fila(id: string, nombre: string, balance: number, aporte?: number): Subcuenta {
    return { id, nombre, balance, aporte };
  }
}