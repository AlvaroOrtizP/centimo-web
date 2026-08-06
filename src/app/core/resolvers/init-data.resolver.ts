import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { FinancialDataService } from '../services/financial-data.service';

export const initDataResolver: ResolveFn<void> = () => {
  const data: FinancialDataService = inject(FinancialDataService);
  data.loadAllPlatforms();
  data.loadAllAccounts();
  data.loadAllSnapshots();
  data.loadAllCrowdlending();
  data.loadAllMyInvestorFunds();
  data.loadFundBalances(new Date().getFullYear(), new Date().getMonth() + 1);

  let y = new Date().getFullYear();
  let m = new Date().getMonth() + 1;
  for (let i = 0; i < 6; i++) {
    data.loadMonthlySummary(y, m);
    m--;
    if (m === 0) { m = 12; y--; }
  }
};
