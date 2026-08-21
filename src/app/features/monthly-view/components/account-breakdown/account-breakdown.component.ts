import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Platform } from '../../../../models/platform';
import { Account } from '../../../../models/account';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';
import { ChecklistItem } from '../../../../models/checklist-item';
import { Expense } from '../../../../models/expense';
import { FinancialDataService } from '../../../../core/services/financial-data.service';

@Component({
  selector: 'app-account-breakdown',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="rounded-xl border border-gray-200/80 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div class="border-b border-gray-100 px-5 py-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-900">Desglose por Cuenta</h2>
          <span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">{{ platforms().length }} plataformas</span>
        </div>
      </div>
      <div class="divide-y divide-gray-100">
        @for (platform of platforms(); track platform.id) {
          <div class="px-5 py-4 transition-colors hover:bg-gray-50/50">
            <div class="flex items-center gap-3">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg" [style.background-color]="platform.color + '15'">
                <span class="h-2.5 w-2.5 rounded-full" [style.background-color]="platform.color"></span>
              </div>
              <a [routerLink]="['/platform', platform.id]" class="group flex items-center gap-1 text-sm font-semibold text-gray-900 transition-colors hover:text-blue-600">
                {{ platform.name }}
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300 transition-colors group-hover:text-blue-400">
                  <path d="M7 7h10v10"/><path d="M7 17 17 7"/>
                </svg>
              </a>
              @if (platformHasNotes(platform.id)) {
                <button
                  class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-amber-600 transition-colors hover:bg-amber-50"
                  (click)="openNotes(platform.id); $event.stopPropagation()"
                  title="Ver notas"
                >
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                  Notas
                </button>
              }
              <span class="ml-auto text-sm font-semibold text-gray-900">
                {{ platformBalance(platform.id).toLocaleString('es-ES') }} €
              </span>
            </div>
            @if (platformFixedNote(platform.id); as note) {
              <div class="mt-2 flex items-start gap-1.5 pl-10">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 flex-shrink-0 text-amber-500">
                  <path d="M12 17a5 5 0 0 0 5-5 5 5 0 0 0-5-5 5 5 0 0 0-5 5 5 5 0 0 0 5 5Z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                </svg>
                <p class="text-xs text-gray-500 leading-relaxed">{{ note }}</p>
              </div>
            }
            <div class="mt-2 space-y-0.5 pl-10">
              @for (account of platformAccounts(platform.id); track account.id) {
                <div>
                  <button
                    class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150 hover:bg-gray-100"
                    (click)="toggle(account.id)"
                  >
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                      class="flex-shrink-0 text-gray-400 transition-transform duration-150"
                      [class.rotate-90]="expandedId() === account.id">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <span class="flex-1 text-gray-700">{{ account.name }}</span>
                    <span class="w-24 text-right font-semibold text-gray-900">{{ accountBalance(account.id).toLocaleString('es-ES') }} €</span>
                    <span class="w-20 text-right text-xs text-cyan-600">{{ accountContribution(account.id) > 0 ? '+' + accountContribution(account.id).toLocaleString('es-ES') + '€' : '-' }}</span>
                    <span class="w-16 text-right text-xs text-green-600">{{ accountIncome(account.id) > 0 ? '+' + accountIncome(account.id).toLocaleString('es-ES') : '-' }}</span>
                    <span class="w-16 text-right text-xs text-red-600">{{ accountExpensesTotal(account.id) > 0 ? accountExpensesTotal(account.id).toLocaleString('es-ES') + '€' : '-' }}</span>
                  </button>
                  @if (expandedId() === account.id) {
                    <div class="ml-4 space-y-2 border-l-2 border-blue-100 pl-4 pb-2">
                      @if (accountExpenses(account.id).length > 0) {
                        <div>
                          <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Gastos</p>
                          @for (e of accountExpenses(account.id); track e.id) {
                            <div class="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-50">
                              <span class="flex items-center gap-1.5 flex-1">
                                <span class="h-1.5 w-1.5 rounded-full bg-red-400"></span>
                                <span class="text-gray-700">{{ e.category }}</span>
                                @if (e.description) {
                                  <span class="text-gray-400">— {{ e.description }}</span>
                                }
                              </span>
                              <span class="w-20 text-right font-medium text-red-600">{{ e.amount.toLocaleString('es-ES') }} €</span>
                            </div>
                          }
                        </div>
                      }
                      @if (accountExpenses(account.id).length === 0) {
                        <p class="py-2 text-center text-xs text-gray-400">Sin detalles disponibles</p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    @if (showNotesPlatformId(); as platformId) {
      <div
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm pt-12 pb-12"
        (click)="closeNotes()"
      >
        <div
          class="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Notas — {{ platformName(platformId) }}
            </h3>
            <button
              aria-label="Cerrar"
              class="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              (click)="closeNotes()"
            >
              <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="mt-4 space-y-5">
            @if (platformFixedNote(platformId); as note) {
              <div class="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-sky-600">Apunte fijo</p>
                <p class="mt-1 text-sm text-gray-700">{{ note }}</p>
              </div>
            }

            @if (platformNotes(platformId); as notes) {
              @for (item of notes; track item.accountName) {
                <div class="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                  <p class="text-[10px] font-semibold uppercase tracking-wider text-amber-700">{{ item.accountName }}</p>
                  <p class="mt-1 text-sm text-gray-700">{{ item.notes }}</p>
                </div>
              }
            }

            @if (platformChecklist(platformId); as checklist) {
              <div>
                <p class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Lista de tareas</p>
                <div class="space-y-1">
                  @for (entry of checklist; track entry.item.id) {
                    <label class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50">
                      <button
                        aria-label="Marcar"
                        class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors"
                        [class.border-green-500]="entry.item.checked"
                        [class.bg-green-500]="entry.item.checked"
                        [class.border-gray-300]="!entry.item.checked"
                        (click)="service.toggleChecklistItem(entry.snapshotId, entry.item.id)"
                      >
                        @if (entry.item.checked) {
                          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        }
                      </button>
                      <span
                        class="flex-1 text-sm"
                        [class.line-through]="entry.item.checked"
                        [class.text-gray-400]="entry.item.checked"
                        [class.text-gray-700]="!entry.item.checked"
                      >{{ entry.item.text }}</span>
                    </label>
                  }
                </div>
              </div>
            }

            @if (!platformFixedNote(platformId) && platformNotes(platformId).length === 0 && platformChecklist(platformId).length === 0) {
              <p class="py-6 text-center text-sm text-gray-400">Sin notas para esta plataforma</p>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class AccountBreakdownComponent {
  protected readonly service = inject(FinancialDataService);

  readonly platforms = input.required<Platform[]>();
  readonly accounts = input.required<Account[]>();
  readonly snapshots = input.required<MonthlySnapshot[]>();
  readonly expenses = input.required<Expense[]>();

  protected readonly expandedId = signal<string | null>(null);
  protected readonly showNotesPlatformId = signal<string | null>(null);

  protected toggle(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  protected openNotes(platformId: string): void {
    this.showNotesPlatformId.set(platformId);
  }

  protected closeNotes(): void {
    this.showNotesPlatformId.set(null);
  }

  protected platformName(platformId: string): string {
    return this.platforms().find(p => p.id === platformId)?.name ?? '';
  }

  protected platformFixedNote(platformId: string): string | undefined {
    return this.platforms().find(p => p.id === platformId)?.fixedNotes;
  }

  protected platformAccounts(platformId: string): Account[] {
    return this.accounts().filter(a => a.platformId === platformId);
  }

  protected platformBalance(platformId: string): number {
    const accountIds = new Set(this.platformAccounts(platformId).map(a => a.id));
    return this.snapshots()
      .filter(s => accountIds.has(s.accountId))
      .reduce((sum, s) => sum + s.balance, 0);
  }

  protected platformHasNotes(platformId: string): boolean {
    return !!this.platformFixedNote(platformId)
      || this.platformNotes(platformId).length > 0
      || this.platformChecklist(platformId).length > 0;
  }

  protected platformNotes(platformId: string): { accountName: string; notes: string }[] {
    const accounts = this.platformAccounts(platformId);
    return accounts
      .map(a => {
        const snap = this.snapshotFor(a.id);
        return snap?.notes ? { accountName: a.name, notes: snap.notes } : null;
      })
      .filter((n): n is { accountName: string; notes: string } => n !== null);
  }

  protected platformChecklist(platformId: string): { snapshotId: string; item: ChecklistItem }[] {
    const accounts = this.platformAccounts(platformId);
    const result: { snapshotId: string; item: ChecklistItem }[] = [];
    for (const a of accounts) {
      const snap = this.snapshotFor(a.id);
      if (snap?.checklistItems) {
        for (const item of snap.checklistItems) {
          result.push({ snapshotId: snap.id, item });
        }
      }
    }
    return result;
  }

  private snapshotFor(accountId: string): MonthlySnapshot | undefined {
    return this.snapshots().find(s => s.accountId === accountId);
  }

  protected accountBalance(accountId: string): number {
    return this.snapshotFor(accountId)?.balance ?? 0;
  }

  protected accountIncome(accountId: string): number {
    return this.snapshotFor(accountId)?.income ?? 0;
  }

  protected accountContribution(accountId: string): number {
    return this.snapshotFor(accountId)?.contribution ?? 0;
  }

  protected accountExpensesTotal(accountId: string): number {
    return this.snapshotFor(accountId)?.expenses ?? 0;
  }

  protected accountExpenses(accountId: string): Expense[] {
    const snap = this.snapshotFor(accountId);
    if (!snap) { return []; }
    return this.expenses().filter(e => e.snapshotId === snap.id);
  }
}
