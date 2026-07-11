import { Platform } from '../../models/platform';
import { PlatformType } from '../../models/platform-type';
import { Account } from '../../models/account';
import { AccountType } from '../../models/account-type';
import { MonthlySnapshot } from '../../models/monthly-snapshot';
import { InvestmentHolding } from '../../models/investment-holding';
import { AssetType } from '../../models/asset-type';
import { InvestmentTransaction } from '../../models/investment-transaction';
import { TransactionType } from '../../models/transaction-type';
import { TradeStatus } from '../../models/trade-status';
import { Expense } from '../../models/expense';
import { ExpenseCategory } from '../../models/expense-category';
import { IncomeSource } from '../../models/income-source';
import { ChecklistItem } from '../../models/checklist-item';
import { CrowdlendingInvestment } from '../../models/crowdlending-investment';
import { ProjectStatus } from '../../models/project-status';

export const MOCK_PLATFORMS: Platform[] = [
  { id: 'bbva',      name: 'BBVA',       type: PlatformType.Bank,          color: '#004481', icon: 'landmark', order: 1, fixedNotes: 'Llamar para revisar condiciones de la hipoteca.' },
  { id: 'myinvestor',name: 'MyInvestor', type: PlatformType.Bank,          color: '#00A3E0', icon: 'piggy-bank', order: 2, fixedNotes: 'Máximo anual aportado: 6000€. Revisar objetivo.' },
  { id: 'b100',      name: 'B100',       type: PlatformType.Bank,          color: '#6C3FD1', icon: 'building', order: 3 },
  { id: 'revolut',   name: 'Revolut',    type: PlatformType.Bank,          color: '#EB008B', icon: 'credit-card', order: 4 },
  { id: 'mintos',    name: 'Mintos',     type: PlatformType.P2P,           color: '#00BFA5', icon: 'trending-up', order: 5 },
  { id: 'equito',    name: 'Equito',     type: PlatformType.Crowdlending,  color: '#FF6B35', icon: 'home', order: 6 },
  { id: 'urbanitae', name: 'Urbanitae',  type: PlatformType.Crowdlending,  color: '#E63946', icon: 'building-2', order: 7 },
  { id: 'etoro',     name: 'eToro',      type: PlatformType.Investment,    color: '#A0C4FF', icon: 'bar-chart', order: 8 },
  { id: 'bitvavo',   name: 'Bitvavo',    type: PlatformType.Crypto,        color: '#F7931A', icon: 'bitcoin', order: 9, fixedNotes: 'Hacer DCA semanal de 50€.' },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'bbva-checking',   platformId: 'bbva',       name: 'Cuenta Nómina',   type: AccountType.Checking,  currency: 'EUR', order: 1 },
  { id: 'myinvestor-checking', platformId: 'myinvestor', name: 'Cuenta Corriente', type: AccountType.Checking, currency: 'EUR', order: 1 },
  { id: 'myinvestor-investment', platformId: 'myinvestor', name: 'Cartera Fondos',  type: AccountType.Investment, currency: 'EUR', order: 2 },
  { id: 'b100-checking',  platformId: 'b100',       name: 'Cuenta Corriente', type: AccountType.Checking,  currency: 'EUR', order: 1 },
  { id: 'b100-savings',   platformId: 'b100',       name: 'Cuenta Ahorro',    type: AccountType.Savings,   currency: 'EUR', order: 2 },
  { id: 'b100-investment', platformId: 'b100',       name: 'Bolsillo Inversión', type: AccountType.Investment, currency: 'EUR', order: 3 },
  { id: 'revolut-main',   platformId: 'revolut',    name: 'Cuenta Principal', type: AccountType.Checking,  currency: 'EUR', order: 1 },
  { id: 'mintos-main',    platformId: 'mintos',     name: 'Cartera Mintos',   type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'equito-main',    platformId: 'equito',     name: 'Cartera Equito',   type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'urbanitae-main', platformId: 'urbanitae',  name: 'Cartera Urbanitae', type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'etoro-main',     platformId: 'etoro',      name: 'Cartera eToro',    type: AccountType.Investment, currency: 'EUR', order: 1 },
  { id: 'bitvavo-main',   platformId: 'bitvavo',    name: 'Cartera Bitvavo',  type: AccountType.Investment, currency: 'EUR', order: 1 },
];

function snapshotId(accountId: string, year: number, month: number): string {
  return `${accountId}-${year}-${String(month).padStart(2, '0')}`;
}

export const MOCK_SNAPSHOTS: MonthlySnapshot[] = [
  // BBVA
  { id: snapshotId('bbva-checking', 2026, 1), accountId: 'bbva-checking', year: 2026, month: 1, balance: 1500, income: 2000, expenses: 1350 },
  { id: snapshotId('bbva-checking', 2026, 2), accountId: 'bbva-checking', year: 2026, month: 2, balance: 1800, income: 2000, expenses: 1700 },
  { id: snapshotId('bbva-checking', 2026, 3), accountId: 'bbva-checking', year: 2026, month: 3, balance: 2100, income: 2000, expenses: 1420 },
  { id: snapshotId('bbva-checking', 2026, 4), accountId: 'bbva-checking', year: 2026, month: 4, balance: 1900, income: 2000, expenses: 1580 },
  { id: snapshotId('bbva-checking', 2026, 5), accountId: 'bbva-checking', year: 2026, month: 5, balance: 2200, income: 2000, expenses: 1410 },
  { id: snapshotId('bbva-checking', 2026, 6), accountId: 'bbva-checking', year: 2026, month: 6, balance: 2500, income: 2000, expenses: 1350, contribution: 2000, notes: 'Pendiente revisar seguro de hogar.', checklistItems: [
    { id: 'bbva-jun-check-1', text: 'Contratar seguro de vida', checked: false },
    { id: 'bbva-jun-check-2', text: 'Pedir cita para revisar hipoteca', checked: false },
    { id: 'bbva-jun-check-3', text: 'Actualizar beneficiarios del testamento', checked: true },
  ] },

  // MyInvestor Checking
  { id: snapshotId('myinvestor-checking', 2026, 1), accountId: 'myinvestor-checking', year: 2026, month: 1, balance: 2000, income: 0, expenses: 0 },
  { id: snapshotId('myinvestor-checking', 2026, 2), accountId: 'myinvestor-checking', year: 2026, month: 2, balance: 2100, income: 100, expenses: 0 },
  { id: snapshotId('myinvestor-checking', 2026, 3), accountId: 'myinvestor-checking', year: 2026, month: 3, balance: 2200, income: 100, expenses: 0 },
  { id: snapshotId('myinvestor-checking', 2026, 4), accountId: 'myinvestor-checking', year: 2026, month: 4, balance: 2300, income: 100, expenses: 0 },
  { id: snapshotId('myinvestor-checking', 2026, 5), accountId: 'myinvestor-checking', year: 2026, month: 5, balance: 2400, income: 100, expenses: 0 },
  { id: snapshotId('myinvestor-checking', 2026, 6), accountId: 'myinvestor-checking', year: 2026, month: 6, balance: 2500, income: 100, expenses: 0 },

  // MyInvestor Investment
  { id: snapshotId('myinvestor-investment', 2026, 1), accountId: 'myinvestor-investment', year: 2026, month: 1, balance: 10200, income: 200, expenses: 0 },
  { id: snapshotId('myinvestor-investment', 2026, 2), accountId: 'myinvestor-investment', year: 2026, month: 2, balance: 10400, income: 200, expenses: 0 },
  { id: snapshotId('myinvestor-investment', 2026, 3), accountId: 'myinvestor-investment', year: 2026, month: 3, balance: 10300, income: 200, expenses: 0 },
  { id: snapshotId('myinvestor-investment', 2026, 4), accountId: 'myinvestor-investment', year: 2026, month: 4, balance: 10600, income: 200, expenses: 0 },
  { id: snapshotId('myinvestor-investment', 2026, 5), accountId: 'myinvestor-investment', year: 2026, month: 5, balance: 10800, income: 200, expenses: 0 },
  { id: snapshotId('myinvestor-investment', 2026, 6), accountId: 'myinvestor-investment', year: 2026, month: 6, balance: 11100, income: 200, expenses: 0, notes: 'Rebalancear cartera: reducir exposición a renta variable.', checklistItems: [
    { id: 'myinv-jun-check-1', text: 'Vender 10% del S&P500 Index', checked: false },
    { id: 'myinv-jun-check-2', text: 'Comprar RF con lo obtenido', checked: false },
  ] },

  // B100 Corriente
  { id: snapshotId('b100-checking', 2026, 1), accountId: 'b100-checking', year: 2026, month: 1, balance: 1000, income: 0, expenses: 0 },
  { id: snapshotId('b100-checking', 2026, 2), accountId: 'b100-checking', year: 2026, month: 2, balance: 1100, income: 100, expenses: 0 },
  { id: snapshotId('b100-checking', 2026, 3), accountId: 'b100-checking', year: 2026, month: 3, balance: 1050, income: 0, expenses: 50 },
  { id: snapshotId('b100-checking', 2026, 4), accountId: 'b100-checking', year: 2026, month: 4, balance: 1200, income: 150, expenses: 0 },
  { id: snapshotId('b100-checking', 2026, 5), accountId: 'b100-checking', year: 2026, month: 5, balance: 1150, income: 0, expenses: 50 },
  { id: snapshotId('b100-checking', 2026, 6), accountId: 'b100-checking', year: 2026, month: 6, balance: 1300, income: 150, expenses: 0 },

  // B100 Ahorro
  { id: snapshotId('b100-savings', 2026, 1), accountId: 'b100-savings', year: 2026, month: 1, balance: 3100, income: 100, expenses: 0 },
  { id: snapshotId('b100-savings', 2026, 2), accountId: 'b100-savings', year: 2026, month: 2, balance: 3200, income: 100, expenses: 0 },
  { id: snapshotId('b100-savings', 2026, 3), accountId: 'b100-savings', year: 2026, month: 3, balance: 3300, income: 100, expenses: 0 },
  { id: snapshotId('b100-savings', 2026, 4), accountId: 'b100-savings', year: 2026, month: 4, balance: 3400, income: 100, expenses: 0 },
  { id: snapshotId('b100-savings', 2026, 5), accountId: 'b100-savings', year: 2026, month: 5, balance: 3500, income: 100, expenses: 0 },
  { id: snapshotId('b100-savings', 2026, 6), accountId: 'b100-savings', year: 2026, month: 6, balance: 3600, income: 100, expenses: 0 },

  // B100 Inversión
  { id: snapshotId('b100-investment', 2026, 1), accountId: 'b100-investment', year: 2026, month: 1, balance: 2050, income: 50, expenses: 0 },
  { id: snapshotId('b100-investment', 2026, 2), accountId: 'b100-investment', year: 2026, month: 2, balance: 2100, income: 50, expenses: 0 },
  { id: snapshotId('b100-investment', 2026, 3), accountId: 'b100-investment', year: 2026, month: 3, balance: 2150, income: 50, expenses: 0 },
  { id: snapshotId('b100-investment', 2026, 4), accountId: 'b100-investment', year: 2026, month: 4, balance: 2200, income: 50, expenses: 0 },
  { id: snapshotId('b100-investment', 2026, 5), accountId: 'b100-investment', year: 2026, month: 5, balance: 2250, income: 50, expenses: 0 },
  { id: snapshotId('b100-investment', 2026, 6), accountId: 'b100-investment', year: 2026, month: 6, balance: 2300, income: 50, expenses: 0 },

  // Revolut
  { id: snapshotId('revolut-main', 2026, 1), accountId: 'revolut-main', year: 2026, month: 1, balance: 500, income: 0, expenses: 0 },
  { id: snapshotId('revolut-main', 2026, 2), accountId: 'revolut-main', year: 2026, month: 2, balance: 450, income: 0, expenses: 50 },
  { id: snapshotId('revolut-main', 2026, 3), accountId: 'revolut-main', year: 2026, month: 3, balance: 600, income: 150, expenses: 0 },
  { id: snapshotId('revolut-main', 2026, 4), accountId: 'revolut-main', year: 2026, month: 4, balance: 550, income: 0, expenses: 50 },
  { id: snapshotId('revolut-main', 2026, 5), accountId: 'revolut-main', year: 2026, month: 5, balance: 500, income: 0, expenses: 50 },
  { id: snapshotId('revolut-main', 2026, 6), accountId: 'revolut-main', year: 2026, month: 6, balance: 650, income: 150, expenses: 0 },

  // Mintos
  { id: snapshotId('mintos-main', 2026, 1), accountId: 'mintos-main', year: 2026, month: 1, balance: 5035, income: 35, expenses: 0 },
  { id: snapshotId('mintos-main', 2026, 2), accountId: 'mintos-main', year: 2026, month: 2, balance: 5070, income: 35, expenses: 0 },
  { id: snapshotId('mintos-main', 2026, 3), accountId: 'mintos-main', year: 2026, month: 3, balance: 5105, income: 35, expenses: 0 },
  { id: snapshotId('mintos-main', 2026, 4), accountId: 'mintos-main', year: 2026, month: 4, balance: 5140, income: 35, expenses: 0 },
  { id: snapshotId('mintos-main', 2026, 5), accountId: 'mintos-main', year: 2026, month: 5, balance: 5175, income: 35, expenses: 0 },
  { id: snapshotId('mintos-main', 2026, 6), accountId: 'mintos-main', year: 2026, month: 6, balance: 5210, income: 35, expenses: 0 },

  // Equito
  { id: snapshotId('equito-main', 2026, 1), accountId: 'equito-main', year: 2026, month: 1, balance: 3000, income: 0, expenses: 0 },
  { id: snapshotId('equito-main', 2026, 2), accountId: 'equito-main', year: 2026, month: 2, balance: 3000, income: 0, expenses: 0 },
  { id: snapshotId('equito-main', 2026, 3), accountId: 'equito-main', year: 2026, month: 3, balance: 3100, income: 100, expenses: 0 },
  { id: snapshotId('equito-main', 2026, 4), accountId: 'equito-main', year: 2026, month: 4, balance: 3100, income: 0, expenses: 0 },
  { id: snapshotId('equito-main', 2026, 5), accountId: 'equito-main', year: 2026, month: 5, balance: 3200, income: 100, expenses: 0 },
  { id: snapshotId('equito-main', 2026, 6), accountId: 'equito-main', year: 2026, month: 6, balance: 3200, income: 0, expenses: 0 },

  // Urbanitae
  { id: snapshotId('urbanitae-main', 2026, 1), accountId: 'urbanitae-main', year: 2026, month: 1, balance: 4000, income: 0, expenses: 0 },
  { id: snapshotId('urbanitae-main', 2026, 2), accountId: 'urbanitae-main', year: 2026, month: 2, balance: 4050, income: 50, expenses: 0 },
  { id: snapshotId('urbanitae-main', 2026, 3), accountId: 'urbanitae-main', year: 2026, month: 3, balance: 4050, income: 0, expenses: 0 },
  { id: snapshotId('urbanitae-main', 2026, 4), accountId: 'urbanitae-main', year: 2026, month: 4, balance: 4100, income: 50, expenses: 0 },
  { id: snapshotId('urbanitae-main', 2026, 5), accountId: 'urbanitae-main', year: 2026, month: 5, balance: 4100, income: 0, expenses: 0 },
  { id: snapshotId('urbanitae-main', 2026, 6), accountId: 'urbanitae-main', year: 2026, month: 6, balance: 4150, income: 50, expenses: 0 },

  // eToro
  { id: snapshotId('etoro-main', 2026, 1), accountId: 'etoro-main', year: 2026, month: 1, balance: 8200, income: 0, expenses: 0 },
  { id: snapshotId('etoro-main', 2026, 2), accountId: 'etoro-main', year: 2026, month: 2, balance: 7900, income: 0, expenses: 0 },
  { id: snapshotId('etoro-main', 2026, 3), accountId: 'etoro-main', year: 2026, month: 3, balance: 8400, income: 100, expenses: 0 },
  { id: snapshotId('etoro-main', 2026, 4), accountId: 'etoro-main', year: 2026, month: 4, balance: 8100, income: 0, expenses: 0 },
  { id: snapshotId('etoro-main', 2026, 5), accountId: 'etoro-main', year: 2026, month: 5, balance: 8600, income: 200, expenses: 0 },
  { id: snapshotId('etoro-main', 2026, 6), accountId: 'etoro-main', year: 2026, month: 6, balance: 8900, income: 100, expenses: 0 },

  // Bitvavo
  { id: snapshotId('bitvavo-main', 2026, 1), accountId: 'bitvavo-main', year: 2026, month: 1, balance: 5500, income: 0, expenses: 0 },
  { id: snapshotId('bitvavo-main', 2026, 2), accountId: 'bitvavo-main', year: 2026, month: 2, balance: 5710, income: 0, expenses: 0 },
  { id: snapshotId('bitvavo-main', 2026, 3), accountId: 'bitvavo-main', year: 2026, month: 3, balance: 5330, income: 0, expenses: 0 },
  { id: snapshotId('bitvavo-main', 2026, 4), accountId: 'bitvavo-main', year: 2026, month: 4, balance: 5770, income: 0, expenses: 0 },
  { id: snapshotId('bitvavo-main', 2026, 5), accountId: 'bitvavo-main', year: 2026, month: 5, balance: 6030, income: 0, expenses: 0 },
  { id: snapshotId('bitvavo-main', 2026, 6), accountId: 'bitvavo-main', year: 2026, month: 6, balance: 5900, income: 0, expenses: 0, contribution: 200, notes: 'Esperar a que BTC baje de 50k para comprar más.' },
];

export const MOCK_HOLDINGS: InvestmentHolding[] = [
  // MyInvestor - S&P500 Index Fund
  { id: 'holding-myinvestor-sp500-01', snapshotId: snapshotId('myinvestor-investment', 2026, 1), assetName: 'S&P500 Index', assetType: AssetType.IndexFund, quantity: 85, valuePerUnit: 120, totalValue: 10200 },
  { id: 'holding-myinvestor-sp500-02', snapshotId: snapshotId('myinvestor-investment', 2026, 2), assetName: 'S&P500 Index', assetType: AssetType.IndexFund, quantity: 86, valuePerUnit: 120.93, totalValue: 10400 },
  { id: 'holding-myinvestor-sp500-03', snapshotId: snapshotId('myinvestor-investment', 2026, 3), assetName: 'S&P500 Index', assetType: AssetType.IndexFund, quantity: 86, valuePerUnit: 119.77, totalValue: 10300 },
  { id: 'holding-myinvestor-sp500-04', snapshotId: snapshotId('myinvestor-investment', 2026, 4), assetName: 'S&P500 Index', assetType: AssetType.IndexFund, quantity: 87, valuePerUnit: 121.84, totalValue: 10600 },
  { id: 'holding-myinvestor-sp500-05', snapshotId: snapshotId('myinvestor-investment', 2026, 5), assetName: 'S&P500 Index', assetType: AssetType.IndexFund, quantity: 87, valuePerUnit: 124.14, totalValue: 10800 },
  { id: 'holding-myinvestor-sp500-06', snapshotId: snapshotId('myinvestor-investment', 2026, 6), assetName: 'S&P500 Index', assetType: AssetType.IndexFund, quantity: 88, valuePerUnit: 126.14, totalValue: 11100 },

  // Bitvavo - BTC
  { id: 'holding-bitvavo-btc-01', snapshotId: snapshotId('bitvavo-main', 2026, 1), assetName: 'Bitcoin', assetType: AssetType.Crypto, quantity: 0.05, valuePerUnit: 50000, totalValue: 2500 },
  { id: 'holding-bitvavo-btc-02', snapshotId: snapshotId('bitvavo-main', 2026, 2), assetName: 'Bitcoin', assetType: AssetType.Crypto, quantity: 0.05, valuePerUnit: 52000, totalValue: 2600 },
  { id: 'holding-bitvavo-btc-03', snapshotId: snapshotId('bitvavo-main', 2026, 3), assetName: 'Bitcoin', assetType: AssetType.Crypto, quantity: 0.05, valuePerUnit: 48000, totalValue: 2400 },
  { id: 'holding-bitvavo-btc-04', snapshotId: snapshotId('bitvavo-main', 2026, 4), assetName: 'Bitcoin', assetType: AssetType.Crypto, quantity: 0.065, valuePerUnit: 51000, totalValue: 3315 },
  { id: 'holding-bitvavo-btc-05', snapshotId: snapshotId('bitvavo-main', 2026, 5), assetName: 'Bitcoin', assetType: AssetType.Crypto, quantity: 0.065, valuePerUnit: 54000, totalValue: 3510 },
  { id: 'holding-bitvavo-btc-06', snapshotId: snapshotId('bitvavo-main', 2026, 6), assetName: 'Bitcoin', assetType: AssetType.Crypto, quantity: 0.065, valuePerUnit: 56000, totalValue: 3640 },

  // Bitvavo - ETH
  { id: 'holding-bitvavo-eth-01', snapshotId: snapshotId('bitvavo-main', 2026, 1), assetName: 'Ethereum', assetType: AssetType.Crypto, quantity: 1.0, valuePerUnit: 3000, totalValue: 3000 },
  { id: 'holding-bitvavo-eth-02', snapshotId: snapshotId('bitvavo-main', 2026, 2), assetName: 'Ethereum', assetType: AssetType.Crypto, quantity: 1.0, valuePerUnit: 3110, totalValue: 3110 },
  { id: 'holding-bitvavo-eth-03', snapshotId: snapshotId('bitvavo-main', 2026, 3), assetName: 'Ethereum', assetType: AssetType.Crypto, quantity: 1.0, valuePerUnit: 2930, totalValue: 2930 },
  { id: 'holding-bitvavo-eth-04', snapshotId: snapshotId('bitvavo-main', 2026, 4), assetName: 'Ethereum', assetType: AssetType.Crypto, quantity: 1.0, valuePerUnit: 2455, totalValue: 2455 },
  { id: 'holding-bitvavo-eth-05', snapshotId: snapshotId('bitvavo-main', 2026, 5), assetName: 'Ethereum', assetType: AssetType.Crypto, quantity: 1.0, valuePerUnit: 2520, totalValue: 2520 },
  { id: 'holding-bitvavo-eth-06', snapshotId: snapshotId('bitvavo-main', 2026, 6), assetName: 'Ethereum', assetType: AssetType.Crypto, quantity: 1.0, valuePerUnit: 2260, totalValue: 2260 },

  // eToro
  { id: 'holding-etoro-aapl-06', snapshotId: snapshotId('etoro-main', 2026, 6), assetName: 'Apple', assetType: AssetType.Stock, quantity: 10, valuePerUnit: 210, totalValue: 2100 },
  { id: 'holding-etoro-msft-06', snapshotId: snapshotId('etoro-main', 2026, 6), assetName: 'Microsoft', assetType: AssetType.Stock, quantity: 5, valuePerUnit: 450, totalValue: 2250 },
  { id: 'holding-etoro-ivv-06', snapshotId: snapshotId('etoro-main', 2026, 6), assetName: 'iShares S&P500', assetType: AssetType.ETF, quantity: 30, valuePerUnit: 85, totalValue: 2550 },
];

export const MOCK_TRADES: InvestmentTransaction[] = [
  // Bitvavo BTC buys
  { id: 'trade-btc-1', accountId: 'bitvavo-main', assetName: 'Bitcoin', assetType: AssetType.Crypto, type: TransactionType.Buy, buyDate: '2025-11-15', buyQuantity: 0.05, buyPricePerUnit: 45000, buyTotalCost: 2250, status: TradeStatus.Open },
  { id: 'trade-btc-2', accountId: 'bitvavo-main', assetName: 'Bitcoin', assetType: AssetType.Crypto, type: TransactionType.Buy, buyDate: '2026-04-10', buyQuantity: 0.015, buyPricePerUnit: 49500, buyTotalCost: 742.5, status: TradeStatus.Open },

  // Bitvavo ETH buys
  { id: 'trade-eth-1', accountId: 'bitvavo-main', assetName: 'Ethereum', assetType: AssetType.Crypto, type: TransactionType.Buy, buyDate: '2025-12-01', buyQuantity: 1.0, buyPricePerUnit: 2800, buyTotalCost: 2800, status: TradeStatus.Open },

  // Bitvavo ETH partial sell
  { id: 'trade-eth-2', accountId: 'bitvavo-main', assetName: 'Ethereum', assetType: AssetType.Crypto, type: TransactionType.Sell, buyDate: '2025-12-01', buyQuantity: 1.0, buyPricePerUnit: 2800, buyTotalCost: 2800, sellDate: '2026-03-20', sellPricePerUnit: 2950, sellTotalReceived: 2950, sellQuantity: 0.5, pnl: 75, status: TradeStatus.Closed },

  // eToro trades
  { id: 'trade-aapl-1', accountId: 'etoro-main', assetName: 'Apple', assetType: AssetType.Stock, type: TransactionType.Buy, buyDate: '2026-01-20', buyQuantity: 10, buyPricePerUnit: 195, buyTotalCost: 1950, status: TradeStatus.Open },
  { id: 'trade-msft-1', accountId: 'etoro-main', assetName: 'Microsoft', assetType: AssetType.Stock, type: TransactionType.Buy, buyDate: '2026-02-15', buyQuantity: 5, buyPricePerUnit: 420, buyTotalCost: 2100, status: TradeStatus.Open },
  { id: 'trade-ivv-1', accountId: 'etoro-main', assetName: 'iShares S&P500', assetType: AssetType.ETF, type: TransactionType.Buy, buyDate: '2026-03-01', buyQuantity: 30, buyPricePerUnit: 78, buyTotalCost: 2340, status: TradeStatus.Open },

  // eToro closed trade (sell)
  { id: 'trade-tsla-1', accountId: 'etoro-main', assetName: 'Tesla', assetType: AssetType.Stock, type: TransactionType.Sell, buyDate: '2026-01-10', buyQuantity: 5, buyPricePerUnit: 380, buyTotalCost: 1900, sellDate: '2026-05-20', sellPricePerUnit: 420, sellTotalReceived: 2100, sellQuantity: 5, pnl: 200, status: TradeStatus.Closed },
];

export const MOCK_INCOMES: IncomeSource[] = [
  { id: 'inc-bbva-1', snapshotId: snapshotId('bbva-checking', 2026, 1), source: 'salary', description: 'Nómina enero', amount: 2000 },
  { id: 'inc-bbva-2', snapshotId: snapshotId('bbva-checking', 2026, 2), source: 'salary', description: 'Nómina febrero', amount: 2000 },
  { id: 'inc-bbva-3', snapshotId: snapshotId('bbva-checking', 2026, 3), source: 'salary', description: 'Nómina marzo', amount: 2000 },
  { id: 'inc-bbva-4', snapshotId: snapshotId('bbva-checking', 2026, 4), source: 'salary', description: 'Nómina abril', amount: 2000 },
  { id: 'inc-bbva-5', snapshotId: snapshotId('bbva-checking', 2026, 5), source: 'salary', description: 'Nómina mayo', amount: 2000 },
  { id: 'inc-bbva-6', snapshotId: snapshotId('bbva-checking', 2026, 6), source: 'salary', description: 'Nómina junio', amount: 2000 },
  { id: 'inc-mintos-1', snapshotId: snapshotId('mintos-main', 2026, 1), source: 'interest', description: 'Intereses Mintos enero', amount: 35 },
  { id: 'inc-mintos-2', snapshotId: snapshotId('mintos-main', 2026, 2), source: 'interest', description: 'Intereses Mintos febrero', amount: 35 },
  { id: 'inc-mintos-3', snapshotId: snapshotId('mintos-main', 2026, 3), source: 'interest', description: 'Intereses Mintos marzo', amount: 35 },
  { id: 'inc-mintos-4', snapshotId: snapshotId('mintos-main', 2026, 4), source: 'interest', description: 'Intereses Mintos abril', amount: 35 },
  { id: 'inc-mintos-5', snapshotId: snapshotId('mintos-main', 2026, 5), source: 'interest', description: 'Intereses Mintos mayo', amount: 35 },
  { id: 'inc-mintos-6', snapshotId: snapshotId('mintos-main', 2026, 6), source: 'interest', description: 'Intereses Mintos junio', amount: 35 },
  { id: 'inc-etoro-3', snapshotId: snapshotId('etoro-main', 2026, 3), source: 'dividend', description: 'Dividendos Apple', amount: 100 },
  { id: 'inc-etoro-5', snapshotId: snapshotId('etoro-main', 2026, 5), source: 'capital_gains', description: 'Venta Tesla', amount: 200 },
  { id: 'inc-etoro-6', snapshotId: snapshotId('etoro-main', 2026, 6), source: 'dividend', description: 'Dividendos Microsoft', amount: 100 },
];

export const MOCK_EXPENSES: Expense[] = [
  // Enero
  { id: 'exp-bbva-01', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Comida, amount: 350, description: 'Supermercado enero' },
  { id: 'exp-bbva-02', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Ocio, amount: 120, description: 'Cena y cine' },
  { id: 'exp-bbva-03', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Coche, amount: 80, description: 'Gasolina' },
  { id: 'exp-bbva-04', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Trabajo, amount: 200, description: 'Material trabajo' },
  { id: 'exp-bbva-05', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Ejercicio, amount: 50, description: 'Gimnasio' },
  { id: 'exp-bbva-07', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Aseo, amount: 45, description: 'Productos aseo' },
  { id: 'exp-bbva-08', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Medicamento, amount: 25, description: 'Farmacia' },
  { id: 'exp-bbva-09', snapshotId: snapshotId('bbva-checking', 2026, 1), category: ExpenseCategory.Discord, amount: 10, description: 'Discord Nitro' },

  // Febrero
  { id: 'exp-bbva-10', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Comida, amount: 380, description: 'Supermercado febrero' },
  { id: 'exp-bbva-11', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Ocio, amount: 200, description: 'Concierto' },
  { id: 'exp-bbva-12', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Coche, amount: 90, description: 'Gasolina' },
  { id: 'exp-bbva-13', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Trabajo, amount: 150, description: 'Cursos' },
  { id: 'exp-bbva-14', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Ejercicio, amount: 50, description: 'Gimnasio' },
  { id: 'exp-bbva-15', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Aseo, amount: 30, description: 'Productos aseo' },
  { id: 'exp-bbva-16', snapshotId: snapshotId('bbva-checking', 2026, 2), category: ExpenseCategory.Discord, amount: 10, description: 'Discord Nitro' },

  // Marzo
  { id: 'exp-bbva-17', snapshotId: snapshotId('bbva-checking', 2026, 3), category: ExpenseCategory.Comida, amount: 340, description: 'Supermercado marzo' },
  { id: 'exp-bbva-18', snapshotId: snapshotId('bbva-checking', 2026, 3), category: ExpenseCategory.Ocio, amount: 90, description: 'Salir' },
  { id: 'exp-bbva-19', snapshotId: snapshotId('bbva-checking', 2026, 3), category: ExpenseCategory.Coche, amount: 75, description: 'Gasolina' },
  { id: 'exp-bbva-20', snapshotId: snapshotId('bbva-checking', 2026, 3), category: ExpenseCategory.Ejercicio, amount: 50, description: 'Gimnasio' },
  { id: 'exp-bbva-21', snapshotId: snapshotId('bbva-checking', 2026, 3), category: ExpenseCategory.Discord, amount: 10, description: 'Discord Nitro' },
  { id: 'exp-bbva-22', snapshotId: snapshotId('bbva-checking', 2026, 3), category: ExpenseCategory.Aseo, amount: 55, description: 'Productos aseo' },

  // Abril
  { id: 'exp-bbva-23', snapshotId: snapshotId('bbva-checking', 2026, 4), category: ExpenseCategory.Comida, amount: 370, description: 'Supermercado abril' },
  { id: 'exp-bbva-24', snapshotId: snapshotId('bbva-checking', 2026, 4), category: ExpenseCategory.Ocio, amount: 150, description: 'Restaurante' },
  { id: 'exp-bbva-25', snapshotId: snapshotId('bbva-checking', 2026, 4), category: ExpenseCategory.Coche, amount: 100, description: 'Gasolina + lavado' },
  { id: 'exp-bbva-26', snapshotId: snapshotId('bbva-checking', 2026, 4), category: ExpenseCategory.Ejercicio, amount: 50, description: 'Gimnasio' },
  { id: 'exp-bbva-27', snapshotId: snapshotId('bbva-checking', 2026, 4), category: ExpenseCategory.Discord, amount: 10, description: 'Discord Nitro' },
  { id: 'exp-bbva-28', snapshotId: snapshotId('bbva-checking', 2026, 4), category: ExpenseCategory.Medicamento, amount: 35, description: 'Farmacia' },

  // Mayo
  { id: 'exp-bbva-29', snapshotId: snapshotId('bbva-checking', 2026, 5), category: ExpenseCategory.Comida, amount: 320, description: 'Supermercado mayo' },
  { id: 'exp-bbva-30', snapshotId: snapshotId('bbva-checking', 2026, 5), category: ExpenseCategory.Ocio, amount: 100, description: 'Netflix y salir' },
  { id: 'exp-bbva-31', snapshotId: snapshotId('bbva-checking', 2026, 5), category: ExpenseCategory.Coche, amount: 80, description: 'Gasolina' },
  { id: 'exp-bbva-32', snapshotId: snapshotId('bbva-checking', 2026, 5), category: ExpenseCategory.Ejercicio, amount: 50, description: 'Gimnasio' },
  { id: 'exp-bbva-33', snapshotId: snapshotId('bbva-checking', 2026, 5), category: ExpenseCategory.Discord, amount: 10, description: 'Discord Nitro' },
  { id: 'exp-bbva-34', snapshotId: snapshotId('bbva-checking', 2026, 5), category: ExpenseCategory.Trabajo, amount: 50, description: 'Transporte' },

  // Junio
  { id: 'exp-bbva-35', snapshotId: snapshotId('bbva-checking', 2026, 6), category: ExpenseCategory.Comida, amount: 360, description: 'Supermercado junio' },
  { id: 'exp-bbva-36', snapshotId: snapshotId('bbva-checking', 2026, 6), category: ExpenseCategory.Ocio, amount: 130, description: 'Cena cumpleaños' },
  { id: 'exp-bbva-37', snapshotId: snapshotId('bbva-checking', 2026, 6), category: ExpenseCategory.Coche, amount: 85, description: 'Gasolina' },
  { id: 'exp-bbva-38', snapshotId: snapshotId('bbva-checking', 2026, 6), category: ExpenseCategory.Ejercicio, amount: 50, description: 'Gimnasio' },
  { id: 'exp-bbva-39', snapshotId: snapshotId('bbva-checking', 2026, 6), category: ExpenseCategory.Discord, amount: 10, description: 'Discord Nitro' },
  { id: 'exp-bbva-40', snapshotId: snapshotId('bbva-checking', 2026, 6), category: ExpenseCategory.Aseo, amount: 40, description: 'Productos aseo' },

  // B100 expenses
  { id: 'exp-b100-01', snapshotId: snapshotId('b100-checking', 2026, 3), category: ExpenseCategory.Otros, amount: 50, description: 'Compra varia' },
  { id: 'exp-b100-02', snapshotId: snapshotId('b100-checking', 2026, 5), category: ExpenseCategory.Otros, amount: 50, description: 'Compra varia' },
];

export const MOCK_CROWDLENDING: CrowdlendingInvestment[] = [
  // Mintos - P2P loans
  { id: 'mint-loan-1', platformId: 'mintos', projectName: 'Préstamo personal Letonia', investedAmount: 1000, interestRate: 8.5, termMonths: 12, startDate: '2025-10-01', endDate: '2026-10-01', monthlyReturn: 7.08, totalReturned: 70.8, status: ProjectStatus.Active },
  { id: 'mint-loan-2', platformId: 'mintos', projectName: 'Préstamo empresarial Estonia', investedAmount: 800, interestRate: 9.2, termMonths: 6, startDate: '2026-01-15', endDate: '2026-07-15', monthlyReturn: 6.13, totalReturned: 36.78, status: ProjectStatus.Active },
  { id: 'mint-loan-3', platformId: 'mintos', projectName: 'Préstamo hipotecario Chequia', investedAmount: 1500, interestRate: 7.8, termMonths: 24, startDate: '2025-06-01', endDate: '2027-06-01', monthlyReturn: 9.75, totalReturned: 117, status: ProjectStatus.Active },
  { id: 'mint-loan-4', platformId: 'mintos', projectName: 'Préstamo corto plazo Finlandia', investedAmount: 500, interestRate: 6.5, termMonths: 3, startDate: '2026-03-01', endDate: '2026-06-01', monthlyReturn: 2.71, totalReturned: 8.13, status: ProjectStatus.Completed },
  { id: 'mint-loan-5', platformId: 'mintos', projectName: 'Préstamo consolidación Lituania', investedAmount: 1200, interestRate: 10.1, termMonths: 18, startDate: '2025-12-01', endDate: '2027-06-01', monthlyReturn: 10.1, totalReturned: 60.6, status: ProjectStatus.Active },
  { id: 'mint-loan-6', platformId: 'mintos', projectName: 'Préstamo negocio Georgia', investedAmount: 400, interestRate: 11.5, termMonths: 12, startDate: '2026-02-01', endDate: '2027-02-01', monthlyReturn: 3.83, totalReturned: 19.15, status: ProjectStatus.Defaulted },

  // Equito - Italian business loans
  { id: 'eqt-loan-1', platformId: 'equito', projectName: 'Startup tecnológica Milán', investedAmount: 1500, interestRate: 8.0, termMonths: 24, startDate: '2025-09-01', endDate: '2027-09-01', monthlyReturn: 10, totalReturned: 100, status: ProjectStatus.Active },
  { id: 'eqt-loan-2', platformId: 'equito', projectName: 'Pymes industria Roma', investedAmount: 1000, interestRate: 7.5, termMonths: 12, startDate: '2026-01-01', endDate: '2027-01-01', monthlyReturn: 6.25, totalReturned: 31.25, status: ProjectStatus.Active },
  { id: 'eqt-loan-3', platformId: 'equito', projectName: 'Expansión restauración Nápoles', investedAmount: 800, interestRate: 9.0, termMonths: 18, startDate: '2025-11-01', endDate: '2027-05-01', monthlyReturn: 6, totalReturned: 42, status: ProjectStatus.Active },
  { id: 'eqt-loan-4', platformId: 'equito', projectName: 'Inmobiliaria Turín', investedAmount: 1200, interestRate: 7.0, termMonths: 6, startDate: '2026-02-01', endDate: '2026-08-01', monthlyReturn: 7, totalReturned: 28, status: ProjectStatus.Active },

  // Urbanitae - Real estate crowdfunding
  { id: 'urb-proj-1', platformId: 'urbanitae', projectName: 'Residencia estudiantes Madrid', investedAmount: 2000, interestRate: 12.0, termMonths: 18, startDate: '2025-08-01', endDate: '2027-02-01', monthlyReturn: 20, totalReturned: 160, status: ProjectStatus.Active },
  { id: 'urb-proj-2', platformId: 'urbanitae', projectName: 'Oficinas coworking Barcelona', investedAmount: 1500, interestRate: 10.5, termMonths: 24, startDate: '2025-10-01', endDate: '2027-10-01', monthlyReturn: 13.13, totalReturned: 105, status: ProjectStatus.Active },
  { id: 'urb-proj-3', platformId: 'urbanitae', projectName: 'Viviendas turísticas Sevilla', investedAmount: 1000, interestRate: 11.0, termMonths: 12, startDate: '2026-01-01', endDate: '2027-01-01', monthlyReturn: 9.17, totalReturned: 45.85, status: ProjectStatus.Active },
];
