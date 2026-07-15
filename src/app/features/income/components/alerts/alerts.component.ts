import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTH_OPTIONS } from '../../../../core/constants/date.constants';
import { Alert } from '../../../../models/alert';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Alertas</h3>
            <p class="text-xs text-gray-500">Avisos que se muestran en la pestaña de Nómina</p>
          </div>
          <button
            class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            (click)="openAddModal()"
          >+ Añadir</button>
        </div>

        @if (groupedAlerts().length > 0) {
          <div class="space-y-4">
            @for (group of groupedAlerts(); track group.label) {
              <div>
                <h4 class="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">{{ group.label }}</h4>
                <div class="space-y-1">
                  @for (a of group.alerts; track a.id) {
                    <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                      <span class="inline-block rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">!</span>
                      <span class="flex-1 font-medium text-gray-900">{{ a.description }}</span>
                      <button
                        aria-label="Editar alerta"
                        class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        (click)="openEditModal(a)"
                        title="Editar"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        aria-label="Eliminar alerta"
                        class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        (click)="deleteAlert(a)"
                        title="Eliminar"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="text-sm text-gray-400">No hay alertas configuradas</p>
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            {{ editingAlert() ? 'Editar Alerta' : 'Nueva Alerta' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Descripción</label>
              <input
                type="text"
                placeholder="Ej: Revisar impuestos, Pago seguro..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                [(ngModel)]="modalDescription"
              />
            </div>

            <div class="flex gap-4">
              <div class="flex-1">
                <label class="mb-1 block text-xs font-medium text-gray-600">Mes</label>
                <select
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                  [(ngModel)]="modalMonth"
                >
                  @for (m of months; track m.value) {
                    <option [value]="m.value">{{ m.label }}</option>
                  }
                </select>
              </div>
              <div class="flex-1">
                <label class="mb-1 block text-xs font-medium text-gray-600">Año</label>
                <select
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                  [(ngModel)]="modalYear"
                >
                  @for (y of years; track y) {
                    <option [value]="y">{{ y }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              (click)="closeModal()"
            >Cancelar</button>
            <button
              class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              [disabled]="!modalDescription()"
              (click)="saveModal()"
            >{{ editingAlert() ? 'Guardar' : 'Añadir' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AlertsComponent {
  private readonly service = inject(FinancialDataService);

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = [2024, 2025, 2026, 2027, 2028];

  protected readonly groupedAlerts = computed(() => {
    const all = this.service.getAllAlerts();
    const groups: { label: string; alerts: Alert[] }[] = [];

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const sorted = [...all].sort((a, b) => a.year - b.year || a.month - b.month);

    const map = new Map<string, Alert[]>();
    for (const a of sorted) {
      const key = `${a.year}-${a.month}`;
      if (!map.has(key)) { map.set(key, []); }
      map.get(key)!.push(a);
    }

    for (const [key, alerts] of map) {
      const [year, month] = key.split('-').map(Number);
      groups.push({ label: `${monthNames[month - 1]} ${year}`, alerts });
    }

    return groups;
  });

  protected readonly showModal = signal(false);
  protected readonly editingAlert = signal<Alert | null>(null);

  protected readonly modalDescription = signal('');
  protected readonly modalMonth = signal(1);
  protected readonly modalYear = signal(this.service.currentYear());

  protected openAddModal(): void {
    this.editingAlert.set(null);
    this.modalDescription.set('');
    this.modalMonth.set(this.service.currentMonth());
    this.modalYear.set(this.service.currentYear());
    this.showModal.set(true);
  }

  protected openEditModal(alert: Alert): void {
    this.editingAlert.set(alert);
    this.modalDescription.set(alert.description);
    this.modalMonth.set(alert.month);
    this.modalYear.set(alert.year);
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.editingAlert.set(null);
  }

  protected saveModal(): void {
    const editing = this.editingAlert();

    const data: Alert = {
      id: editing?.id ?? `alert-${Date.now()}`,
      description: this.modalDescription(),
      month: this.modalMonth(),
      year: this.modalYear(),
    };

    if (editing) {
      this.service.updateAlert(editing.id, data);
    } else {
      this.service.addAlert(data);
    }

    this.closeModal();
  }

  protected deleteAlert(alert: Alert): void {
    this.service.deleteAlert(alert.id);
  }
}
