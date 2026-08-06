import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { MyInvestorFormComponent } from './myinvestor-form.component';
import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { FundBalancesService } from '../../../../api/generated/api/fundBalances.service';
import { provideApiMocks } from '../../../../core/testing/api-mocks';
import { configureSeedSpies, applyFinancialSeed } from '../../../../core/testing/test-seed';

describe('MyInvestorFormComponent temp', () => {
  let service: FinancialDataService;
  let fundBalancesApi: jasmine.SpyObj<FundBalancesService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyInvestorFormComponent],
      providers: provideApiMocks(),
    });
    configureSeedSpies();
    service = applyFinancialSeed();
    fundBalancesApi = TestBed.inject(FundBalancesService) as jasmine.SpyObj<FundBalancesService>;
  });

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
    comp.fundsLocalYear.set(2026);
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
});
