import { Provider } from '@angular/core';
import { of } from 'rxjs';

import { AccountsService } from '../../api/generated/api/accounts.service';
import { AlertsService } from '../../api/generated/api/alerts.service';
import { CommitmentsService } from '../../api/generated/api/commitments.service';
import { CrowdlendingService } from '../../api/generated/api/crowdlending.service';
import { ExpensesService } from '../../api/generated/api/expenses.service';
import { FundBalancesService } from '../../api/generated/api/fundBalances.service';
import { IncomesService } from '../../api/generated/api/incomes.service';
import { MyInvestorFundsService } from '../../api/generated/api/myInvestorFunds.service';
import { NominaService } from '../../api/generated/api/nomina.service';
import { PlatformsService } from '../../api/generated/api/platforms.service';
import { SalaryAllocationsService } from '../../api/generated/api/salaryAllocations.service';
import { SnapshotsService } from '../../api/generated/api/snapshots.service';
import { SummariesService } from '../../api/generated/api/summaries.service';
import { TradesService } from '../../api/generated/api/trades.service';

export function apiMock<T>(serviceClass: new (...args: any[]) => T, name: string = serviceClass.name): jasmine.SpyObj<T> {
  const methods = Object.getOwnPropertyNames(serviceClass.prototype).filter(m => m !== 'constructor');
  const spy = jasmine.createSpyObj(name, methods);
  methods.forEach(m => {
    (spy as unknown as Record<string, jasmine.Spy>)[m].and.returnValue(of([]) as never);
  });
  return spy;
}

export function provideApiMocks(): Provider[] {
  return [
    { provide: AccountsService, useValue: apiMock(AccountsService) },
    { provide: AlertsService, useValue: apiMock(AlertsService) },
    { provide: CommitmentsService, useValue: apiMock(CommitmentsService) },
    { provide: CrowdlendingService, useValue: apiMock(CrowdlendingService) },
    { provide: ExpensesService, useValue: apiMock(ExpensesService) },
    { provide: FundBalancesService, useValue: apiMock(FundBalancesService) },
    { provide: IncomesService, useValue: apiMock(IncomesService) },
    { provide: MyInvestorFundsService, useValue: apiMock(MyInvestorFundsService) },
    { provide: NominaService, useValue: apiMock(NominaService) },
    { provide: PlatformsService, useValue: apiMock(PlatformsService) },
    { provide: SalaryAllocationsService, useValue: apiMock(SalaryAllocationsService) },
    { provide: SnapshotsService, useValue: apiMock(SnapshotsService) },
    { provide: SummariesService, useValue: apiMock(SummariesService) },
    { provide: TradesService, useValue: apiMock(TradesService) },
  ];
}
