import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AccountType } from '../../../../models/account-type';
import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { Account } from '../../../../models/account';
import { AssetType } from '../../../../models/asset-type';
import { TransactionType } from '../../../../models/transaction-type';
import { TradeStatus } from '../../../../models/trade-status';
import { InvestmentTransaction } from '../../../../models/investment-transaction';

interface AssetSuggestion {
  ticker: string;
  name: string;
}

const ASSET_SUGGESTIONS: Record<string, AssetSuggestion[]> = {
  crypto: [
    { ticker: 'BTC', name: 'Bitcoin' },
    { ticker: 'ETH', name: 'Ethereum' },
    { ticker: 'SOL', name: 'Solana' },
    { ticker: 'ADA', name: 'Cardano' },
    { ticker: 'DOT', name: 'Polkadot' },
  ],
  stock: [
    { ticker: 'AAPL', name: 'Apple' },
    { ticker: 'MSFT', name: 'Microsoft' },
    { ticker: 'GOOGL', name: 'Alphabet' },
    { ticker: 'AMZN', name: 'Amazon' },
    { ticker: 'NVDA', name: 'NVIDIA' },
  ],
  etf: [
    { ticker: 'VWCE', name: 'Vanguard FTSE All-World' },
    { ticker: 'VUSA', name: 'Vanguard S&P 500' },
    { ticker: 'CSPX', name: 'iShares S&P 500' },
    { ticker: 'IUSA', name: 'iShares Euro Stoxx 50' },
  ],
  index_fund: [],
};

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

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Cuenta</label>
          <select class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" [(ngModel)]="selectedAccountId">
            <option value="">Selecciona cuenta</option>
            @for (acc of accounts(); track acc.id) {
              <option [value]="acc.id">{{ acc.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</label>
          <div class="mt-1 flex gap-2">
            <button
              class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all"
              [class.bg-emerald-600 text-white shadow-sm]="type() === 'buy'"
              [class.bg-gray-100 text-gray-600 hover:bg-gray-200]="type() !== 'buy'"
              (click)="type.set('buy')"
            >Compra</button>
            <button
              class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all"
              [class.bg-red-600 text-white shadow-sm]="type() === 'sell'"
              [class.bg-gray-100 text-gray-600 hover:bg-gray-200]="type() !== 'sell'"
              (click)="type.set('sell')"
            >Venta</button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Clase de activo</label>
          <select class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" [(ngModel)]="assetType">
            <option value="crypto">Crypto</option>
            <option value="stock">Acción</option>
            <option value="etf">ETF</option>
            <option value="index_fund">Fondo Indexado</option>
          </select>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Activo</label>
        <input
          type="text"
          placeholder="Busca o escribe el activo..."
          class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          [(ngModel)]="assetName"
        />
        @if (suggestions().length > 0 && !assetName()) {
          <div class="mt-2 flex flex-wrap gap-1.5">
            @for (s of suggestions(); track s.ticker) {
              <button
                class="rounded-full border px-2.5 py-1 text-xs font-medium transition-colors"
                [class.border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100]="assetType() === 'crypto'"
                [class.border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100]="assetType() === 'stock'"
                [class.border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100]="assetType() === 'etf'"
                (click)="assetName.set(s.ticker)"
              >{{ s.ticker }} <span class="opacity-60">{{ s.name }}</span></button>
            }
          </div>
        }
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Cantidad</label>
          <input
            type="number"
            step="any"
            placeholder="ej: 0.5"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            [(ngModel)]="quantity"
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
            [(ngModel)]="price"
          />
          <p class="mt-0.5 text-xs text-gray-400">Precio por cada unidad</p>
        </div>
        <div>
          <label class="block text-xs font-medium uppercase tracking-wider text-gray-500">Fecha</label>
          <input type="date" class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" [(ngModel)]="date" />
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
          [disabled]="!selectedAccountId() || !assetName() || !quantity() || !price() || !date()"
          (click)="save()"
        >{{ type() === 'buy' ? 'Registrar compra' : 'Registrar venta' }}</button>
        @if (saved()) {
          <span class="text-sm text-emerald-600">✓ Operación registrada</span>
        }
      </div>

      @if (trades().length > 0) {
        <div class="mt-6 border-t border-gray-100 pt-4">
          <p class="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">Historial de operaciones</p>
          <div class="space-y-1">
            @for (t of trades(); track t.id) {
              <div class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50">
                <span
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                  [class.bg-emerald-100 text-emerald-800]="t.type === 'buy'"
                  [class.bg-red-100 text-red-800]="t.type === 'sell'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline [attr.points]="t.type === 'buy' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                  </svg>
                  {{ t.type === 'buy' ? 'COMPRA' : 'VENTA' }}
                </span>
                <span class="w-16 font-semibold text-gray-700">{{ t.assetName }}</span>
                <span class="text-gray-500">{{ t.buyQuantity }} × {{ t.buyPricePerUnit.toLocaleString('es-ES') }} €</span>
                <span class="text-gray-500">= <strong>{{ t.buyTotalCost.toLocaleString('es-ES') }} €</strong></span>
                <span class="text-gray-400">{{ t.buyDate }}</span>
                <button
                  class="ml-auto flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  (click)="deleteTrade(t)"
                  title="Eliminar operación"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class TradeFormComponent {
  private readonly service = inject(FinancialDataService);

  readonly accounts = input.required<Account[]>();

  protected readonly selectedAccountId = signal('');

  protected readonly trades = computed<InvestmentTransaction[]>(() => {
    const id = this.selectedAccountId();
    if (!id) { return []; }
    return this.service.getTradesByAccount(id);
  });

  protected readonly type = signal<'buy' | 'sell'>('buy');
  protected readonly assetName = signal('');
  protected readonly assetType = signal('crypto');
  protected readonly quantity = signal(0);
  protected readonly price = signal(0);
  protected readonly date = signal('');
  protected readonly saved = signal(false);

  protected readonly suggestions = computed(() =>
    ASSET_SUGGESTIONS[this.assetType()] ?? []
  );

  constructor() {
    effect(() => {
      const accs = this.accounts();
      const inv = accs.find(a => a.type === AccountType.Investment);
      this.selectedAccountId.set(inv?.id ?? accs[0]?.id ?? '');
    });
  }

  protected save(): void {
    this.service.addTrade({
      id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      accountId: this.selectedAccountId(),
      assetName: this.assetName(),
      assetType: this.assetType() as AssetType,
      type: this.type() === 'buy' ? TransactionType.Buy : TransactionType.Sell,
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

  protected deleteTrade(t: InvestmentTransaction): void {
    this.service.deleteTrade(t.id);
  }
}
