import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { MyInvestorFormComponent } from './myinvestor-form.component';
import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { FundBalancesService } from '../../../../api/generated/api/fundBalances.service';
import { MyInvestorFundsService } from '../../../../api/generated/api/myInvestorFunds.service';
import { SnapshotsService } from '../../../../api/generated/api/snapshots.service';
import { provideApiMocks } from '../../../../core/testing/api-mocks';
import { configureSeedSpies, applyFinancialSeed } from '../../../../core/testing/test-seed';

describe('MyInvestorFormComponent temp', () => {
  let service: FinancialDataService;
  let fundBalancesApi: jasmine.SpyObj<FundBalancesService>;
  let myInvestorFundsApi: jasmine.SpyObj<MyInvestorFundsService>;
  let snapshotsApi: jasmine.SpyObj<SnapshotsService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyInvestorFormComponent, HttpClientTestingModule],
      providers: provideApiMocks(),
    });
    configureSeedSpies();
    service = applyFinancialSeed();
    fundBalancesApi = TestBed.inject(FundBalancesService) as jasmine.SpyObj<FundBalancesService>;
    myInvestorFundsApi = TestBed.inject(MyInvestorFundsService) as jasmine.SpyObj<MyInvestorFundsService>;
    snapshotsApi = TestBed.inject(SnapshotsService) as jasmine.SpyObj<SnapshotsService>;
    snapshotsApi.upsertSnapshot.and.callFake((body: never) => of({ ...(body as object), id: 'upsert-id' }) as never);
  });

  it('addFund calls createMyInvestorFund endpoint', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyInvestorFormComponent);
    fixture.detectChanges();
    tick();

    const comp = fixture.componentInstance as any;
    comp.newCode.set('ES0110237023');
    comp.newName.set('Indexa Test');
    fixture.detectChanges();
    tick();

    comp.addFund();
    tick();

    expect(myInvestorFundsApi.createMyInvestorFund).toHaveBeenCalled();
    tick(2000);
  }));

  it('saveFundBalance with existing balance calls updateFundBalance', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyInvestorFormComponent);
    fixture.detectChanges();
    tick();

    const comp = fixture.componentInstance as any;
    comp.selectedFundId.set('mif-001');
    fixture.detectChanges();
    tick();

    expect(comp.fundBalanceValue()).toBe(7700);

    comp.saveFundBalance();
    tick();

    expect(fundBalancesApi.updateFundBalance).toHaveBeenCalled();
    expect(fundBalancesApi.createFundBalance).not.toHaveBeenCalled();
    tick(2000);
  }));

  it('saveFundBalance with no existing balance calls createFundBalance', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyInvestorFormComponent);
    fixture.detectChanges();
    tick();

    const comp = fixture.componentInstance as any;
    comp.selectedFundId.set('mif-001');
    comp.fundsLocalMonth.set(7);
    fixture.detectChanges();
    tick();

    expect(comp.fundBalanceValue()).toBeNull();

    comp.fundBalanceValue.set(5000);
    comp.saveFundBalance();
    tick();

    expect(fundBalancesApi.createFundBalance).toHaveBeenCalled();
    expect(fundBalancesApi.updateFundBalance).not.toHaveBeenCalled();
    tick(2000);
  }));

  it('saveFundBalance creates myinvestor-fondo snapshot = sum of fund balances', fakeAsync(() => {
    const fixture = TestBed.createComponent(MyInvestorFormComponent);
    fixture.detectChanges();
    tick();

    const comp = fixture.componentInstance as any;
    comp.fundsLocalMonth.set(7);
    comp.selectedFundId.set('mif-001');
    fixture.detectChanges();
    tick();

    comp.fundBalanceValue.set(5000);
    comp.saveFundBalance();
    tick();
    TestBed.flushEffects();
    tick();

    const balances = comp.currentMonthBalances();
    expect(balances.length).toBe(1);
    expect(balances[0].balance).toBe(5000);
    const snap = service.getSnapshot('myinvestor-fondo', 2026, 7);
    expect(snap).toBeDefined();
    expect(snap!.balance).toBe(5000);
    expect(snapshotsApi.upsertSnapshot).toHaveBeenCalled();
    tick(2000);
  }));
});
