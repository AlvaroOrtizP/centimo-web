import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { SalaryAllocation } from '../../../../models/salary-allocation';

interface MonthConfig {
  year: number;
  month: number;
  label: string;
  allocations: SalaryAllocation[];
}

@Component({
  selector: 'app-salary-config',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900">Configuración de Distribución</h3>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            [disabled]="!canGoBack()"
            (click)="goBack()"
          >← Anterior</button>
          <span class="text-sm text-gray-500">{{ startLabel() }} — {{ endLabel() }}</span>
          <button
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            (click)="goForward()"
          >Siguiente →</button>
        </div>
      </div>

      <!-- Lista de meses -->
      <div class="space-y-3">
        @for (mc of monthConfigs(); track mc.year + '-' + mc.month) {
          <div class="rounded-lg border border-gray-100 p-4 transition-colors hover:border-gray-200">
            <div class="mb-2 flex items-center justify-between">
              <h4 class="font-medium text-gray-900">{{ mc.label }}</h4>
              <button
                class="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                (click)="openAddModal(mc.year, mc.month)"
              >+ Añadir</button>
            </div>

            @if (mc.allocations.length > 0) {
              <div class="space-y-1">
                @for (alloc of mc.allocations; track alloc.id) {
                  <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                    <span class="w-6 text-center">
                      @if (alloc.type === 'percentage') {
                        <span class="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">%</span>
                      } @else {
                        <span class="inline-block rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">€</span>
                      }
                    </span>
                    <span class="font-medium text-gray-900 w-24">
                      {{ getPlatformName(alloc.platformId) }}
                    </span>
                    <span class="w-20 text-right font-medium text-gray-700">
                      {{ alloc.value }}{{ alloc.type === 'percentage' ? '%' : ' €' }}
                    </span>
                    <span class="flex-1 truncate text-gray-500">{{ alloc.note }}</span>
                    <button
                      class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                      (click)="openEditModal(alloc)"
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      (click)="deleteAllocation(alloc)"
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p class="text-xs text-gray-400">Sin configuración</p>
            }
          </div>
        }
      </div>
    </div>

    <!-- Modal Añadir/Editar -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            {{ editingAllocation() ? 'Editar Distribución' : 'Nueva Distribución' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Destino</label>
              <select
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                [(ngModel)]="modalPlatformId"
              >
                <option value="">Seleccionar plataforma</option>
                @for (p of platforms(); track p.id) {
                  <option [value]="p.id">{{ p.name }}</option>
                }
              </select>
            </div>

            <div class="flex gap-4">
              <div class="flex-1">
                <label class="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
                <select
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  [(ngModel)]="modalType"
                >
                  <option value="fixed">€ (Cantidad fija)</option>
                  <option value="percentage">% (Porcentaje)</option>
                </select>
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-xs font-medium text-gray-600">Valor</label>
                <input
                  type="number"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  [(ngModel)]="modalValue"
                />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Nota (opcional)</label>
              <input
                type="text"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                [(ngModel)]="modalNote"
              />
            </div>

            @if (!editingAllocation()) {
              <div>
                <label class="mb-1 block text-xs font-medium text-gray-600">Aplicar a meses</label>
                <select
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                  [(ngModel)]="modalMonthsRange"
                >
                  <option [value]="1">Solo este mes</option>
                  <option [value]="3">Próximos 3 meses</option>
                  <option [value]="6">Próximos 6 meses</option>
                  <option [value]="12">Próximos 12 meses</option>
                </select>
              </div>
            }
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              (click)="closeModal()"
            >Cancelar</button>
            <button
              class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              [disabled]="!modalPlatformId() || !modalValue()"
              (click)="saveModal()"
            >{{ editingAllocation() ? 'Guardar' : 'Añadir' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class SalaryConfigComponent {
  private readonly service = inject(FinancialDataService);

  protected readonly platforms = computed(() => this.service.platforms());

  private readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  protected readonly startMonth = signal(this.service.currentMonth());
  protected readonly startYear = signal(this.service.currentYear());

  protected readonly canGoBack = computed(() => {
    const y = this.startYear();
    const m = this.startMonth();
    const cy = this.service.currentYear();
    const cm = this.service.currentMonth();
    return y > cy || (y === cy && m > cm);
  });

  protected readonly monthConfigs = computed<MonthConfig[]>(() => {
    const result: MonthConfig[] = [];
    let year = this.startYear();
    let month = this.startMonth();

    for (let i = 0; i < 12; i++) {
      result.push({
        year,
        month,
        label: `${this.monthNames[month - 1]} ${year}`,
        allocations: this.service.getSalaryAllocationsByMonth(year, month),
      });
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
    return result;
  });

  protected readonly startLabel = computed(() => {
    const mc = this.monthConfigs()[0];
    return mc ? mc.label : '';
  });

  protected readonly endLabel = computed(() => {
    const mc = this.monthConfigs()[11];
    return mc ? mc.label : '';
  });

  protected goBack(): void {
    let m = this.startMonth() - 1;
    let y = this.startYear();
    if (m < 1) { m = 12; y--; }
    this.startMonth.set(m);
    this.startYear.set(y);
  }

  protected goForward(): void {
    let m = this.startMonth() + 1;
    let y = this.startYear();
    if (m > 12) { m = 1; y++; }
    this.startMonth.set(m);
    this.startYear.set(y);
  }

  protected getPlatformName(platformId: string): string {
    return this.service.getPlatform(platformId)?.name ?? platformId;
  }

  protected deleteAllocation(allocation: SalaryAllocation): void {
    this.service.deleteSalaryAllocation(allocation.id);
  }

  // Modal state
  protected readonly showModal = signal(false);
  protected readonly editingAllocation = signal<SalaryAllocation | null>(null);
  protected readonly modalTargetYear = signal(0);
  protected readonly modalTargetMonth = signal(0);

  protected readonly modalPlatformId = signal('');
  protected readonly modalType = signal<'fixed' | 'percentage'>('fixed');
  protected readonly modalValue = signal(0);
  protected readonly modalNote = signal('');
  protected readonly modalMonthsRange = signal(1);

  protected openAddModal(year: number, month: number): void {
    this.editingAllocation.set(null);
    this.modalTargetYear.set(year);
    this.modalTargetMonth.set(month);
    this.modalPlatformId.set('');
    this.modalType.set('fixed');
    this.modalValue.set(0);
    this.modalNote.set('');
    this.modalMonthsRange.set(1);
    this.showModal.set(true);
  }

  protected openEditModal(allocation: SalaryAllocation): void {
    this.editingAllocation.set(allocation);
    this.modalPlatformId.set(allocation.platformId);
    this.modalType.set(allocation.type);
    this.modalValue.set(allocation.value);
    this.modalNote.set(allocation.note ?? '');
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.editingAllocation.set(null);
  }

  protected saveModal(): void {
    const editing = this.editingAllocation();

    if (editing) {
      this.service.updateSalaryAllocation(editing.id, {
        platformId: this.modalPlatformId(),
        type: this.modalType(),
        value: this.modalValue(),
        note: this.modalNote() || undefined,
      });
    } else {
      const year = this.modalTargetYear();
      const month = this.modalTargetMonth();
      const range = this.modalMonthsRange();

      for (let i = 0; i < range; i++) {
        let m = month + i;
        let y = year;
        if (m > 12) { m -= 12; y++; }

        this.service.addSalaryAllocation({
          id: `sa-${Date.now()}-${i}`,
          year: y,
          month: m,
          platformId: this.modalPlatformId(),
          type: this.modalType(),
          value: this.modalValue(),
          note: this.modalNote() || undefined,
        });
      }
    }

    this.closeModal();
  }
}
