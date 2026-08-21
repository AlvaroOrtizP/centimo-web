import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { FinancialDataService } from '../services/financial-data.service';

export const initDataResolver: ResolveFn<void> = () => {
  const data: FinancialDataService = inject(FinancialDataService);
  data.loadAllPlatforms();
  data.loadAllAccounts();
  data.loadAllSnapshots();
  data.loadFundBalances(new Date().getFullYear(), new Date().getMonth() + 1);
  data.loadAllCrowdlending();
  data.loadAllMyInvestorFunds();

  let y = new Date().getFullYear();
  let m = new Date().getMonth() + 1;
  data.loadMonthlySummariesRange(y, m, 6);
  data.loadPlatformMonthlyBalances(y, m, 6);
};
