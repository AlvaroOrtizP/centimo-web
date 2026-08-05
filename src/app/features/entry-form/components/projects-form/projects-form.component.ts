import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccountType } from '../../../../models/account-type';
import { AssetType } from '../../../../models/asset-type';
import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';

interface ProjectEntry {
  name: string;
  value: number;
}

@Component({
  selector: 'app-projects-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-4">
      @for (acc of investmentAccounts(); track acc.id) {
        <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900">{{ acc.name }}</h3>
            <button
              class="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
              (click)="addProject(acc.id)"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Añadir proyecto
            </button>
          </div>

          @if (getProjects(acc.id).length === 0) {
            <div class="mt-4 flex flex-col items-center gap-2 py-8 text-sm text-gray-400">
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Sin proyectos. Añade uno nuevo.
            </div>
          }

          <div class="mt-3 space-y-2">
            @for (proj of getProjects(acc.id); track proj; let idx = $index) {
              <div class="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2 transition-colors hover:bg-gray-100">
                <input
                  type="text" placeholder="Nombre del proyecto" aria-label="Nombre del proyecto"
                  class="flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  [(ngModel)]="proj.name"
                />
                <div class="relative">
                  <input
                    type="number" placeholder="Valor actual" aria-label="Valor actual"
                    class="w-32 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-right font-medium focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    [(ngModel)]="proj.value"
                  />
                  <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                </div>
                <button
                  class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="removeProject(acc.id, idx)"
                  title="Eliminar proyecto"
                  aria-label="Eliminar proyecto"
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

      @if (investmentAccounts().length > 0) {
        <div class="flex justify-end">
          <button
            class="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            (click)="saveAll()"
          >Guardar Proyectos</button>
        </div>
      }

      @if (saved()) {
        <div class="rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700">
          ✓ Proyectos guardados correctamente
        </div>
      }
    </div>
  `,
})
export class ProjectsFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected readonly saved = signal(false);
  protected readonly projectsMap = signal<Record<string, ProjectEntry[]>>({});

  protected readonly investmentAccounts = computed(() =>
    this.accounts().filter(a => a.type === AccountType.Investment)
  );

  constructor() {
    effect(() => {
      const invAccs = this.investmentAccounts();
      const y = this.year();
      const m = this.month();
      const map: Record<string, ProjectEntry[]> = {};
      for (const acc of invAccs) {
        const snapshotId = `${acc.id}-${y}-${String(m).padStart(2, '0')}`;
        const holdings = this.service.holdings().filter(h => h.snapshotId === snapshotId);
        map[acc.id] = holdings.map(h => ({ name: h.assetName, value: h.totalValue }));
      }
      this.projectsMap.set(map);
    }, { allowSignalWrites: true });
  }

  protected getProjects(accountId: string): ProjectEntry[] {
    return this.projectsMap()[accountId] ?? [];
  }

  protected addProject(accountId: string): void {
    this.projectsMap.update(map => ({
      ...map,
      [accountId]: [...(map[accountId] ?? []), { name: '', value: 0 }],
    }));
  }

  protected removeProject(accountId: string, index: number): void {
    this.projectsMap.update(map => ({
      ...map,
      [accountId]: map[accountId].filter((_, i) => i !== index),
    }));
  }

  protected saveAll(): void {
    const y = this.year();
    const m = this.month();

    for (const acc of this.investmentAccounts()) {
      const snapshotId = `${acc.id}-${y}-${String(m).padStart(2, '0')}`;
      const projects = this.projectsMap()[acc.id] ?? [];

      for (const h of this.service.holdings().filter(h => h.snapshotId === snapshotId)) {
        this.service.deleteHolding(h.id);
      }

      for (const proj of projects) {
        if (!proj.name) { continue; }
        this.service.addHolding({
          id: `hold-${snapshotId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          snapshotId,
          assetName: proj.name,
          assetType: AssetType.Crowdlending,
          quantity: 1,
          valuePerUnit: proj.value,
          totalValue: proj.value,
        });
      }
    }

    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
