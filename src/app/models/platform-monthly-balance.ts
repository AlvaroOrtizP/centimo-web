import { PlatformType } from './platform-type';
import { PlatformMonthlyBalanceEntry } from './platform-monthly-balance-entry';

export interface PlatformMonthlyBalance {
  platformId: string;
  platformName: string;
  type: PlatformType;
  color: string;
  icon: string;
  balances: PlatformMonthlyBalanceEntry[];
}
