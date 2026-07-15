import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { MONTHS, MONTH_OPTIONS } from '../../../../core/constants/date.constants';
import { Commitment, CommitmentType } from '../../../../models/commitment';

interface MonthGroup {
  month: number;
  label: string;
  commitments: Commitment[];
  total: number;
}

@Component({
  selector: 'app-commitments',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Recurrentes -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Recurrentes</h3>
            <p class="text-xs text-gray-500">Se repiten todos los meses</p>
          </div>
          <button
            class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            (click)="openAddModal('monthly')"
          >+ Añadir</button>
        </div>

        @if (recurring().length > 0) {
          <div class="space-y-1">
            @for (c of recurring(); track c.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span class="inline-block rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">M</span>
                <span class="flex-1 font-medium text-gray-900">{{ c.description }}</span>
                @if (c.amount !== null) {
                  <span class="font-medium text-gray-700">{{ c.amount.toLocaleString('es-ES') }} €</span>
                }
                @if (c.isEstimated) {
                  <span class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">est.</span>
                }
                @if (c.category) {
                  <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ c.category }}</span>
                }
                <button
                  aria-label="Editar compromiso"
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                  (click)="openEditModal(c)"
                  title="Editar"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  aria-label="Eliminar compromiso"
                  class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteCommitment(c)"
                  title="Eliminar"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        } @else {
          <p class="text-sm text-gray-400">No hay compromisos recurrentes</p>
        }
      </div>

      <!-- Puntuales -->
      <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900">Puntuales</h3>
            <p class="text-xs text-gray-500">Anuales o puntuales, agrupados por mes</p>
          </div>
          <button
            class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
            (click)="openAddModal('annual')"
          >+ Añadir</button>
        </div>

        @if (oneTimeGroups().length > 0) {
          <div class="space-y-4">
            @for (group of oneTimeGroups(); track group.month) {
              <div>
                <div class="mb-2 flex items-center justify-between">
                  <h4 class="text-xs font-medium uppercase tracking-wider text-gray-500">{{ group.label }}</h4>
                  <span class="text-xs font-medium text-gray-600">{{ group.total.toLocaleString('es-ES') }} €</span>
                </div>
                <div class="space-y-1">
                  @for (c of group.commitments; track c.id) {
                    <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                      @if (c.type === 'annual') {
                        <span class="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">A</span>
                      } @else {
                        <span class="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">1</span>
                      }
                      <span class="flex-1 font-medium text-gray-900">{{ c.description }}</span>
                      @if (c.amount !== null) {
                        <span class="font-medium text-gray-700">{{ c.amount.toLocaleString('es-ES') }} €</span>
                      }
                      @if (c.isEstimated) {
                        <span class="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">est.</span>
                      }
                      @if (c.category) {
                        <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{{ c.category }}</span>
                      }
                      <button
                        aria-label="Editar compromiso"
                        class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        (click)="openEditModal(c)"
                        title="Editar"
                      >
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        aria-label="Eliminar compromiso"
                        class="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        (click)="deleteCommitment(c)"
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
          <p class="text-sm text-gray-400">No hay compromisos puntuales</p>
        }
      </div>
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-lg font-semibold text-gray-900">
            {{ editingCommitment() ? 'Editar Compromiso' : 'Nuevo Compromiso' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Descripción</label>
              <input
                type="text"
                placeholder="Ej: Netflix, Pago Hacienda..."
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                [(ngModel)]="modalDescription"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
              <select
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                [(ngModel)]="modalType"
              >
                <option value="monthly">Mensual (todos los meses)</option>
                <option value="annual">Anual (1 vez al año)</option>
                <option value="once">Una vez</option>
              </select>
            </div>

            @if (modalType() !== 'monthly') {
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
                @if (modalType() === 'once') {
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
                }
              </div>
            }

            <div class="flex gap-4">
              <div class="flex-1">
                <label class="mb-1 block text-xs font-medium text-gray-600">Importe (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                  [(ngModel)]="modalAmount"
                />
              </div>
              <div class="flex items-end pb-0.5">
                <label class="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    [(ngModel)]="modalIsEstimated"
                  />
                  Estimado
                </label>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-gray-600">Categoría</label>
              <select
                class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                [(ngModel)]="modalCategory"
              >
                <option value="">Sin categoría</option>
                <option value="Impuestos">Impuestos</option>
                <option value="Suscripciones">Suscripciones</option>
                <option value="Seguros">Seguros</option>
                <option value="Trámites">Trámites</option>
                <option value="Otros">Otros</option>
              </select>
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
            >{{ editingCommitment() ? 'Guardar' : 'Añadir' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommitmentsComponent {
  private readonly service = inject(FinancialDataService);

  protected readonly months = MONTH_OPTIONS;
  protected readonly years = [2024, 2025, 2026, 2027, 2028];

  protected readonly recurring = computed(() =>
    this.service.getAllCommitments().filter(c => c.type === 'monthly')
  );

  protected readonly oneTimeGroups = computed<MonthGroup[]>(() => {
    const all = this.service.getAllCommitments().filter(c => c.type !== 'monthly');
    const groups: MonthGroup[] = [];

    for (let m = 1; m <= 12; m++) {
      const commitments = all.filter(c => {
        if (c.type === 'annual') { return c.month === m; }
        return c.month === m && (!c.year || c.year === this.service.currentYear());
      });

      if (commitments.length > 0) {
        const total = commitments.reduce((sum, c) => sum + (c.amount ?? 0), 0);
        groups.push({ month: m, label: MONTHS[m - 1], commitments, total });
      }
    }

    return groups;
  });

  protected readonly showModal = signal(false);
  protected readonly editingCommitment = signal<Commitment | null>(null);

  protected readonly modalDescription = signal('');
  protected readonly modalMonth = signal(1);
  protected readonly modalType = signal<CommitmentType>('annual');
  protected readonly modalYear = signal(this.service.currentYear());
  protected readonly modalCategory = signal('');
  protected readonly modalAmount = signal<number | undefined>(undefined);
  protected readonly modalIsEstimated = signal(false);

  protected openAddModal(defaultType: CommitmentType = 'annual'): void {
    this.editingCommitment.set(null);
    this.modalDescription.set('');
    this.modalMonth.set(1);
    this.modalType.set(defaultType);
    this.modalYear.set(this.service.currentYear());
    this.modalCategory.set('');
    this.modalAmount.set(undefined);
    this.modalIsEstimated.set(false);
    this.showModal.set(true);
  }

  protected openEditModal(commitment: Commitment): void {
    this.editingCommitment.set(commitment);
    this.modalDescription.set(commitment.description);
    this.modalMonth.set(commitment.month ?? 1);
    this.modalType.set(commitment.type);
    this.modalYear.set(commitment.year ?? this.service.currentYear());
    this.modalCategory.set(commitment.category ?? '');
    this.modalAmount.set(commitment.amount);
    this.modalIsEstimated.set(commitment.isEstimated ?? false);
    this.showModal.set(true);
  }

  protected closeModal(): void {
    this.showModal.set(false);
    this.editingCommitment.set(null);
  }

  protected saveModal(): void {
    const editing = this.editingCommitment();
    const isMonthly = this.modalType() === 'monthly';

    const data: Commitment = {
      id: editing?.id ?? `commitment-${Date.now()}`,
      description: this.modalDescription(),
      type: this.modalType(),
      month: isMonthly ? 0 : this.modalMonth(),
      year: this.modalType() === 'once' ? this.modalYear() : undefined,
      category: this.modalCategory() || undefined,
      amount: this.modalAmount(),
      isEstimated: this.modalIsEstimated(),
    };

    if (editing) {
      this.service.updateCommitment(editing.id, data);
    } else {
      this.service.addCommitment(data);
    }

    this.closeModal();
  }

  protected deleteCommitment(commitment: Commitment): void {
    this.service.deleteCommitment(commitment.id);
  }
}
