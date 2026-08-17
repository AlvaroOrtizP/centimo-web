import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { AssetType } from '../../../../models/asset-type';
import { TransactionType } from '../../../../models/transaction-type';
import { TradeStatus } from '../../../../models/trade-status';

@Component({
  selector: 'app-trade-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 class="mb-4 text-sm font-semibold text-gray-900">Registrar operación</h3>

      <div class="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
        Recuerda revisar con Hacienda las obligaciones fiscales de las operaciones de inversión.
      </div>

      <div class="mt-4">
        <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Activo</label>
        <input
          type="text"
          placeholder="Busca o escribe el activo..."
          class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          [ngModel]="assetName()"
          (ngModelChange)="assetName.set($event)"
        />
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Cantidad</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 0.5"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            [ngModel]="quantity()"
            (ngModelChange)="quantity.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Unidades compradas o vendidas</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Precio unitario (€)</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 30000"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            [ngModel]="price()"
            (ngModelChange)="price.set($event)"
          />
          <p class="mt-0.5 text-xs text-gray-400">Precio por cada unidad</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</label>
          <input type="date" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" [ngModel]="date()"
 (ngModelChange)="date.set($event)" />
        </div>
      </div>

      @if (quantity() > 0 && price() > 0) {
        <div class="mt-3 rounded-lg bg-violet-50 px-4 py-2 text-sm text-violet-800">
          Total: <strong>{{ (quantity() * price()).toLocaleString('es-ES') }} €</strong>
          <span class="text-violet-500"> ({{ quantity() }} × {{ price() }} €)</span>
        </div>
      }

      <div class="mt-4 flex items-center gap-3">
        <button
          class="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
          [disabled]="!assetName() || !quantity() || !price() || !date()"
          (click)="save()"
        >Registrar compra</button>
        @if (saved()) {
          <span class="text-sm text-emerald-600">✓ Operación registrada</span>
        }
      </div>
    </div>
  `,
})
export class TradeFormComponent {
  private readonly service = inject(FinancialDataService);

  private readonly ACCOUNT_ID = 'bitvavo-main';

  protected readonly assetName = signal('');
  protected readonly assetType = signal<AssetType>(AssetType.Crypto);
  protected readonly quantity = signal(0);
  protected readonly price = signal(0);
  protected readonly date = signal('');
  protected readonly saved = signal(false);

  protected save(): void {
    this.service.addTrade({
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      accountId: this.ACCOUNT_ID,
      assetName: this.assetName(),
      assetType: this.assetType(),
      type: TransactionType.Buy,
      buyDate: this.date(),
      buyQuantity: this.quantity(),
      buyPricePerUnit: this.price(),
      buyTotalCost: this.quantity() * this.price(),
      status: TradeStatus.Open,
    });

    this.assetName.set('');
    this.quantity.set(0);
    this.price.set(0);
    this.date.set('');
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
