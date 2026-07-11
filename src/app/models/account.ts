import { AccountType } from './account-type';

export interface Account {
  id: string;
  platformId: string;
  name: string;
  type: AccountType;
  currency: string;
  order: number;
}
