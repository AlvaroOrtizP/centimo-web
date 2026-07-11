import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';
import { AssetType } from '../../../../models/asset-type';
import { TransactionType } from '../../../../models/transaction-type';
import { TradeStatus } from '../../../../models/trade-status';

@Component({
  selector: 'app-crypto-form',
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
            <input type="text" placeholder="Activo" class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="newAssetName" />
            <input type="number" placeholder="Cantidad" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="newQuantity" />
            <input type="number" placeholder="Precio (€)" class="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="newPrice" />
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

        <div class="border-t border-gray-100 pt-3">
          <p class="mb-2 text-xs font-medium text-gray-500">Nuevo Trade</p>
          <div class="flex flex-wrap gap-2">
            <select class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="tradeType">
              <option value="buy">Compra</option>
              <option value="sell">Venta</option>
            </select>
            <input type="text" placeholder="Activo" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="tradeAsset" />
            <input type="number" placeholder="Cantidad" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="tradeQuantity" />
            <input type="number" placeholder="Precio (€)" class="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="tradePrice" />
            <input type="date" class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" [(ngModel)]="tradeDate" />
            <button class="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700" (click)="addTrade()">+</button>
          </div>
          @for (t of trades(); track t) {
            <div class="mt-1 text-sm text-gray-700">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" [class.bg-green-100]="t.type === 'buy'" [class.text-green-700]="t.type === 'buy'" [class.bg-red-100]="t.type === 'sell'" [class.text-red-700]="t.type === 'sell'">
                {{ t.type === 'buy' ? 'COMPRA' : 'VENTA' }}
              </span>
              {{ t.asset }} {{ t.quantity }} &#64; {{ t.price }} € ({{ t.date }})
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
export class CryptoFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly account = input.required<Account>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();

  protected balance = signal(0);
  protected newAssetName = signal('');
  protected newQuantity = signal(0);
  protected newPrice = signal(0);
  protected tradeType = signal('buy');
  protected tradeAsset = signal('');
  protected tradeQuantity = signal(0);
  protected tradePrice = signal(0);
  protected tradeDate = signal('');

  protected readonly holdings = signal<{ assetName: string; quantity: number; price: number }[]>([]);
  protected readonly trades = signal<{ type: string; asset: string; quantity: number; price: number; date: string }[]>([]);

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

  protected addTrade(): void {
    if (!this.tradeAsset() || !this.tradeQuantity() || !this.tradePrice() || !this.tradeDate()) { return; }
    this.trades.update(arr => [...arr, {
      type: this.tradeType(),
      asset: this.tradeAsset(),
      quantity: this.tradeQuantity(),
      price: this.tradePrice(),
      date: this.tradeDate(),
    }]);
    this.tradeAsset.set('');
    this.tradeQuantity.set(0);
    this.tradePrice.set(0);
    this.tradeDate.set('');
  }

  protected save(): void {
    const acc = this.account();
    const y = this.year();
    const m = this.month();
    const snapshotId = `${acc.id}-${y}-${String(m).padStart(2, '0')}`;

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
        assetType: AssetType.Crypto,
        quantity: h.quantity,
        valuePerUnit: h.price,
        totalValue: h.quantity * h.price,
      });
    }

    for (const t of this.trades()) {
      this.service.addTrade({
        id: `trade-${snapshotId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        accountId: acc.id,
        assetName: t.asset,
        assetType: AssetType.Crypto,
        type: t.type === 'buy' ? TransactionType.Buy : TransactionType.Sell,
        buyDate: t.date,
        buyQuantity: t.type === 'buy' ? t.quantity : 0,
        buyPricePerUnit: t.price,
        buyTotalCost: t.quantity * t.price,
        sellQuantity: t.type === 'sell' ? t.quantity : undefined,
        sellPricePerUnit: t.type === 'sell' ? t.price : undefined,
        sellTotalReceived: t.type === 'sell' ? t.quantity * t.price : undefined,
        status: TradeStatus.Open,
      });
    }

    this.holdings.set([]);
    this.trades.set([]);
    this.balance.set(0);
  }
}
