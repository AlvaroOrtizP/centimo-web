import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { FinancialDataService } from '../services/financial-data.service';

export const initDataResolver: ResolveFn<void> = () => {
  const data: FinancialDataService = inject(FinancialDataService);
  // Solo datos globales compartidos por todas las pantallas. El resto
  // (resúmenes, balances de plataforma, balances de fondos, crowdlending,
  // fondos MyInvestor) se carga bajo demanda en cada feature.
  data.loadAllPlatforms();
  data.loadAllAccounts();
  data.loadAllSnapshots();
};
