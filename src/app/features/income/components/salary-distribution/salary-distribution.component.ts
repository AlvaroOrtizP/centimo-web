import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { SalaryAllocation } from '../../../../models/salary-allocation';

@Component({
  selector: 'app-salary-distribution',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Distribución del Sueldo</h3>

      <!-- Barra de progreso -->
      <div class="mb-5 rounded-lg bg-gray-50 p-4">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-medium text-gray-700">Asignado: {{ assignedAmount() }} €</span>
          @if (monthlySalary() > 0) {
            <span class="text-gray-500">{{ assignedPercentage() }}%</span>
          }
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            class="h-full rounded-full bg-green-500 transition-all duration-300"
            [style.width.%]="monthlySalary() > 0 ? assignedPercentage() : 0"
          ></div>
        </div>
        @if (monthlySalary() > 0) {
          <div class="mt-1 text-xs text-gray-500">
            Restante: {{ (monthlySalary() - assignedAmount()).toLocaleString('es-ES') }} € ({{ (100 - assignedPercentage()) }}%)
          </div>
        }
      </div>

      <!-- Sueldo del mes -->
      <div class="mb-4">
        <label class="mb-1 block text-xs font-medium text-gray-600">Sueldo neto del mes (€)</label>
        <input
          type="number"
          placeholder="Ej: 1500"
          class="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
          [(ngModel)]="monthlySalary"
        />
      </div>

      <!-- Formulario -->
      <div class="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Destino</label>
          <select
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            [(ngModel)]="selectedPlatformId"
          >
            <option value="">Seleccionar plataforma</option>
            @for (p of platforms(); track p.id) {
              <option [value]="p.id">{{ p.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
          <select
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            [(ngModel)]="allocationType"
          >
            <option value="fixed">€ (Cantidad fija)</option>
            <option value="percentage">% (Porcentaje)</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs font-medium text-gray-600">Valor</label>
          <input
            type="number"
            [placeholder]="allocationType() === 'fixed' ? 'Ej: 50' : 'Ej: 10'"
            class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            [(ngModel)]="allocationValue"
          />
        </div>

        <div class="flex-1">
          <label class="mb-1 block text-xs font-medium text-gray-600">Nota (opcional)</label>
          <input
            type="text"
            placeholder="Ej: Fondos indexados"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
            [(ngModel)]="allocationNote"
          />
        </div>

        <button
          class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          [disabled]="!selectedPlatformId() || !allocationValue()"
          (click)="save()"
        >Añadir</button>
      </div>

      @if (saved()) {
        <p class="mb-3 text-sm text-green-600">Distribución añadida correctamente</p>
      }

      <!-- Lista de distribuciones -->
      @if (allocations().length > 0) {
        <div class="border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Distribuciones del mes</p>
          <div class="space-y-1">
            @for (alloc of allocations(); track alloc.id) {
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
                  aria-label="Eliminar distribución"
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteAllocation(alloc)"
                  title="Eliminar distribución"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      } @else {
        <p class="text-sm text-gray-400">No hay distribuciones registradas para este mes</p>
      }
    </div>
  `,
})
export class SalaryDistributionComponent {
  private readonly service = inject(FinancialDataService);

  readonly month = input.required<number>();
  readonly year = input.required<number>();

  protected readonly platforms = computed(() => this.service.platforms());

  protected readonly allocations = computed(() =>
    this.service.getSalaryAllocationsByMonth(this.year(), this.month())
  );

  protected readonly selectedPlatformId = signal('');
  protected readonly allocationType = signal<'fixed' | 'percentage'>('fixed');
  protected readonly allocationValue = signal(0);
  protected readonly allocationNote = signal('');
  protected readonly saved = signal(false);

  protected readonly monthlySalary = signal(0);

  protected readonly assignedAmount = computed(() => {
    const salary = this.monthlySalary();
    return this.allocations().reduce((sum, a) => {
      if (a.type === 'fixed') {
        return sum + a.value;
      }
      return sum + (salary * a.value) / 100;
    }, 0);
  });

  protected readonly assignedPercentage = computed(() => {
    const salary = this.monthlySalary();
    if (salary <= 0) { return 0; }
    return Math.round((this.assignedAmount() / salary) * 100);
  });

  protected getPlatformName(platformId: string): string {
    return this.service.getPlatform(platformId)?.name ?? platformId;
  }

  protected save(): void {
    this.service.addSalaryAllocation({
      id: `sa-${Date.now()}`,
      year: this.year(),
      month: this.month(),
      platformId: this.selectedPlatformId(),
      type: this.allocationType(),
      value: this.allocationValue(),
      note: this.allocationNote() || undefined,
    });

    this.selectedPlatformId.set('');
    this.allocationType.set('fixed');
    this.allocationValue.set(0);
    this.allocationNote.set('');
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }

  protected deleteAllocation(allocation: SalaryAllocation): void {
    this.service.deleteSalaryAllocation(allocation.id);
  }
}
