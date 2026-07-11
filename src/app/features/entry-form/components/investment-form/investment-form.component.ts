import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';
import { AssetType } from '../../../../models/asset-type';

@Component({
  selector: 'app-investment-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">{{ account().name }}</h3>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-500">Balance Cartera (€)</label>
          <input
            type="number"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            [(ngModel)]="balance"
          />
        </div>

        <div class="border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium text-gray-500">Holdings</p>
          <div class="flex gap-2">
            <input type="text" placeholder="Activo" class="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="newAssetName" />
            <input type="number" placeholder="Cantidad" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="newQuantity" />
            <input type="number" placeholder="Precio unitario" class="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="newPrice" />
            <button class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700" (click)="addHolding()">+</button>
          </div>
          @for (h of holdings(); track h) {
            <div class="mt-1 flex items-center gap-2 text-sm text-gray-700">
              <span class="font-medium text-gray-900">{{ h.assetName }}</span>
              <span class="text-gray-500">{{ h.quantity }} × {{ h.price }} €</span>
              <span class="font-medium text-gray-900">= {{ (h.quantity * h.price).toLocaleString('es-ES') }} €</span>
            </div>
          }
        </div>

        <button class="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700" (click)="save()">
          Guardar Snapshot
        </button>
      </div>
    </div>
  `,
})
export class InvestmentFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly account = input.required<Account>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected balance = signal(0);
  protected newAssetName = signal('');
  protected newQuantity = signal(0);
  protected newPrice = signal(0);

  protected readonly holdings = signal<{ assetName: string; quantity: number; price: number }[]>([]);

  protected addHolding(): void {
    if (!this.newAssetName() || !this.newQuantity() || !this.newPrice()) { return; }
    this.holdings.update(arr => [...arr, {
      assetName: this.newAssetName(),
      quantity: this.newQuantity(),
      price: this.newPrice(),
    }]);
    this.newAssetName.set('');
    this.newQuantity.set(0);
    this.newPrice.set(0);
  }

  protected save(): void {
    const acc = this.account();
    const y = this.year();
    const m = this.month();
    const snapshotId = `${acc.id}-${y}-${String(m).padStart(2, '0')}`;
    const totalValue = this.holdings().reduce((s, h) => s + h.quantity * h.price, 0);

    const existing = this.service.getSnapshot(acc.id, y, m);
    if (existing) {
      this.service.updateSnapshot(existing.id, { balance: this.balance(), income: 0, expenses: 0 });
    } else {
      this.service.addSnapshot({
        id: snapshotId,
        accountId: acc.id,
        year: y,
        month: m,
        balance: this.balance(),
        income: 0,
        expenses: 0,
      });
    }

    for (const h of this.holdings()) {
      this.service.addHolding({
        id: `hold-${snapshotId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        snapshotId,
        assetName: h.assetName,
        assetType: AssetType.IndexFund,
        quantity: h.quantity,
        valuePerUnit: h.price,
        totalValue: h.quantity * h.price,
      });
    }

    this.holdings.set([]);
    this.balance.set(0);
  }
}
