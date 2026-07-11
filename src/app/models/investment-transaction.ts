import { AssetType } from './asset-type';
import { TradeStatus } from './trade-status';
import { TransactionType } from './transaction-type';

export interface InvestmentTransaction {
  id: string;
  accountId: string;
  assetName: string;
  assetType: AssetType;
  type: TransactionType;
  buyDate: string;
  buyQuantity: number;
  buyPricePerUnit: number;
  buyTotalCost: number;
  sellDate?: string;
  sellPricePerUnit?: number;
  sellTotalReceived?: number;
  sellQuantity?: number;
  pnl?: number;
  status: TradeStatus;
}
