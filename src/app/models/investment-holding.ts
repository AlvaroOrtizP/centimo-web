import { AssetType } from './asset-type';

export interface InvestmentHolding {
  id: string;
  snapshotId: string;
  assetName: string;
  assetType: AssetType;
  quantity: number;
  valuePerUnit: number;
  totalValue: number;
}
