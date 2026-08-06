import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { IncomeComponent } from './income.component';
import { FinancialDataService } from '../../core/services/financial-data.service';
import { IncomeFormComponent } from '../entry-form/components/income-form/income-form.component';
import { SalaryDistributionComponent } from './components/salary-distribution/salary-distribution.component';
import { provideApiMocks } from '../../core/testing/api-mocks';
import { configureSeedSpies, applyFinancialSeed } from '../../core/testing/test-seed';

describe('IncomeComponent', () => {
  let component: IncomeComponent;
  let fixture: ComponentFixture<IncomeComponent>;
  let service: FinancialDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, IncomeComponent, IncomeFormComponent, SalaryDistributionComponent],
      providers: provideApiMocks(),
    }).compileComponents();
    configureSeedSpies();
    service = applyFinancialSeed();

    // Datos mock de asignaciones de salario (junio: 3, mayo: 2)
    service.addSalaryAllocation({ id: 'sa-mock-jun-1', year: 2026, month: 6, platformId: 'myinvestor', type: 'percentage', value: 30, note: 'Fondos indexados' });
    service.addSalaryAllocation({ id: 'sa-mock-jun-2', year: 2026, month: 6, platformId: 'b100', type: 'fixed', value: 200, note: 'Ahorro junio' });
    service.addSalaryAllocation({ id: 'sa-mock-jun-3', year: 2026, month: 6, platformId: 'revolut', type: 'fixed', value: 100, note: 'Viajes' });
    service.addSalaryAllocation({ id: 'sa-mock-may-1', year: 2026, month: 5, platformId: 'myinvestor', type: 'percentage', value: 25, note: 'Fondos mayo' });
    service.addSalaryAllocation({ id: 'sa-mock-may-2', year: 2026, month: 5, platformId: 'b100', type: 'fixed', value: 150, note: 'Ahorro mayo' });

    fixture = TestBed.createComponent(IncomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initially have no incomes in mock data', () => {
    expect(service.incomes().length).toBe(0);
  });

  it('should have salary allocations mock data for June 2026', () => {
    const allocations = service.getSalaryAllocationsByMonth(2026, 6);
    expect(allocations.length).toBe(3);
  });

  describe('month switching with income and distribution data', () => {
    beforeEach(fakeAsync(() => {
      // Add income for current month (June 2026)
      service.addSnapshot({
        id: 'bbva-checking-2026-06',
        accountId: 'bbva-checking',
        year: 2026,
        month: 6,
        balance: 2500,
        income: 1800,
        expenses: 0,
      });
      service.addIncome({
        id: 'inc-june-salary',
        snapshotId: 'bbva-checking-2026-06',
        source: 'Nómina',
        description: 'Salario junio',
        amount: 1800,
      });

      // Add income for previous month (May 2026)
      service.addSnapshot({
        id: 'bbva-checking-2026-05',
        accountId: 'bbva-checking',
        year: 2026,
        month: 5,
        balance: 2200,
        income: 1600,
        expenses: 0,
      });
      service.addIncome({
        id: 'inc-may-salary',
        snapshotId: 'bbva-checking-2026-05',
        source: 'Nómina',
        description: 'Salario mayo',
        amount: 1600,
      });

      // Add salary allocation for current month (June 2026)
      service.addSalaryAllocation({
        id: 'sa-june-1',
        year: 2026,
        month: 6,
        platformId: 'myinvestor',
        type: 'percentage',
        value: 30,
        note: 'Fondos indexados',
      });

      // Add salary allocation for previous month (May 2026)
      service.addSalaryAllocation({
        id: 'sa-may-1',
        year: 2026,
        month: 5,
        platformId: 'b100',
        type: 'fixed',
        value: 200,
        note: 'Ahorro mayo',
      });

      tick();
      fixture.detectChanges();
    }));

    it('should display income form and distribution sections', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Añadir Ingreso');
      expect(compiled.textContent).toContain('distribuye tu sueldo');
    });

    it('should have incomes for June 2026', () => {
      const incomes = service.getIncomesBySnapshot('bbva-checking-2026-06');
      expect(incomes.length).toBe(1);
      expect(incomes[0].source).toBe('Nómina');
      expect(incomes[0].amount).toBe(1800);
    });

    it('should have incomes for May 2026', () => {
      const incomes = service.getIncomesBySnapshot('bbva-checking-2026-05');
      expect(incomes.length).toBe(1);
      expect(incomes[0].source).toBe('Nómina');
      expect(incomes[0].amount).toBe(1600);
    });

    it('should have salary allocation for June 2026', () => {
      const allocations = service.getSalaryAllocationsByMonth(2026, 6);
      expect(allocations.length).toBe(4); // 3 mock + 1 added
      const added = allocations.find(a => a.id === 'sa-june-1');
      expect(added).toBeDefined();
      expect(added!.platformId).toBe('myinvestor');
      expect(added!.type).toBe('percentage');
      expect(added!.value).toBe(30);
    });

    it('should have salary allocation for May 2026', () => {
      const allocations = service.getSalaryAllocationsByMonth(2026, 5);
      expect(allocations.length).toBe(3); // 2 mock + 1 added
      const added = allocations.find(a => a.id === 'sa-may-1');
      expect(added).toBeDefined();
      expect(added!.platformId).toBe('b100');
      expect(added!.type).toBe('fixed');
      expect(added!.value).toBe(200);
    });

    it('should show different data when switching months', () => {
      // Verify June data exists
      const juneIncomes = service.getIncomesBySnapshot('bbva-checking-2026-06');
      expect(juneIncomes.length).toBe(1);
      expect(juneIncomes[0].amount).toBe(1800);

      // Verify May data exists
      const mayIncomes = service.getIncomesBySnapshot('bbva-checking-2026-05');
      expect(mayIncomes.length).toBe(1);
      expect(mayIncomes[0].amount).toBe(1600);

      // Verify allocations exist per month with different data
      const juneAllocations = service.getSalaryAllocationsByMonth(2026, 6);
      const mayAllocations = service.getSalaryAllocationsByMonth(2026, 5);

      // June has the added allocation for myinvestor
      expect(juneAllocations.some(a => a.id === 'sa-june-1')).toBeTrue();
      // May has its own allocation for b100
      expect(mayAllocations.some(a => a.id === 'sa-may-1')).toBeTrue();
      // They are different sets
      expect(juneAllocations.length).not.toBe(mayAllocations.length);
    });
  });

  describe('salary allocation CRUD for next 6 months', () => {
    const baseYear = 2026;
    const baseMonth = 6;

    beforeEach(() => {
      // Create allocations for next 6 months (July to December 2026)
      for (let i = 1; i <= 6; i++) {
        let month = baseMonth + i;
        let year = baseYear;
        if (month > 12) { month -= 12; year++; }

        service.addSalaryAllocation({
          id: `sa-future-${i}`,
          year,
          month,
          platformId: 'myinvestor',
          type: 'percentage',
          value: 20 + i,
          note: `Ahorro mes ${month}`,
        });
      }
      fixture.detectChanges();
    });

    it('should create allocations for 6 future months', () => {
      // July 2026
      const jul = service.getSalaryAllocationsByMonth(2026, 7);
      expect(jul.some(a => a.id === 'sa-future-1')).toBeTrue();
      expect(jul.find(a => a.id === 'sa-future-1')!.value).toBe(21);

      // August 2026
      const aug = service.getSalaryAllocationsByMonth(2026, 8);
      expect(aug.some(a => a.id === 'sa-future-2')).toBeTrue();
      expect(aug.find(a => a.id === 'sa-future-2')!.value).toBe(22);

      // September 2026
      const sep = service.getSalaryAllocationsByMonth(2026, 9);
      expect(sep.some(a => a.id === 'sa-future-3')).toBeTrue();

      // October 2026
      const oct = service.getSalaryAllocationsByMonth(2026, 10);
      expect(oct.some(a => a.id === 'sa-future-4')).toBeTrue();

      // November 2026
      const nov = service.getSalaryAllocationsByMonth(2026, 11);
      expect(nov.some(a => a.id === 'sa-future-5')).toBeTrue();

      // December 2026
      const dec = service.getSalaryAllocationsByMonth(2026, 12);
      expect(dec.some(a => a.id === 'sa-future-6')).toBeTrue();
      expect(dec.find(a => a.id === 'sa-future-6')!.value).toBe(26);
    });

    it('should edit an allocation value and note', () => {
      // Edit July allocation
      const julBefore = service.getSalaryAllocationsByMonth(2026, 7);
      const toEdit = julBefore.find(a => a.id === 'sa-future-1');
      expect(toEdit).toBeDefined();
      expect(toEdit!.value).toBe(21);
      expect(toEdit!.note).toBe('Ahorro mes 7');

      service.updateSalaryAllocation('sa-future-1', {
        value: 35,
        note: 'Fondos indexados actualizado',
      });

      const julAfter = service.getSalaryAllocationsByMonth(2026, 7);
      const edited = julAfter.find(a => a.id === 'sa-future-1');
      expect(edited).toBeDefined();
      expect(edited!.value).toBe(35);
      expect(edited!.note).toBe('Fondos indexados actualizado');
    });

    it('should edit allocation type from percentage to fixed', () => {
      service.updateSalaryAllocation('sa-future-2', {
        type: 'fixed',
        value: 150,
      });

      const aug = service.getSalaryAllocationsByMonth(2026, 8);
      const edited = aug.find(a => a.id === 'sa-future-2');
      expect(edited).toBeDefined();
      expect(edited!.type).toBe('fixed');
      expect(edited!.value).toBe(150);
    });

    it('should delete an allocation', () => {
      // Verify September allocation exists
      const sepBefore = service.getSalaryAllocationsByMonth(2026, 9);
      expect(sepBefore.some(a => a.id === 'sa-future-3')).toBeTrue();

      service.deleteSalaryAllocation('sa-future-3');

      const sepAfter = service.getSalaryAllocationsByMonth(2026, 9);
      expect(sepAfter.some(a => a.id === 'sa-future-3')).toBeFalse();
    });

    it('should delete multiple allocations across months', () => {
      service.deleteSalaryAllocation('sa-future-4');
      service.deleteSalaryAllocation('sa-future-5');

      const oct = service.getSalaryAllocationsByMonth(2026, 10);
      const nov = service.getSalaryAllocationsByMonth(2026, 11);

      expect(oct.some(a => a.id === 'sa-future-4')).toBeFalse();
      expect(nov.some(a => a.id === 'sa-future-5')).toBeFalse();

      // Other months should still have their allocations
      const jul = service.getSalaryAllocationsByMonth(2026, 7);
      const dec = service.getSalaryAllocationsByMonth(2026, 12);
      expect(jul.some(a => a.id === 'sa-future-1')).toBeTrue();
      expect(dec.some(a => a.id === 'sa-future-6')).toBeTrue();
    });

    it('should maintain data integrity after mixed operations', () => {
      // Edit October
      service.updateSalaryAllocation('sa-future-4', { value: 50 });

      // Delete November
      service.deleteSalaryAllocation('sa-future-5');

      // Add new allocation for January 2027
      service.addSalaryAllocation({
        id: 'sa-jan-2027',
        year: 2027,
        month: 1,
        platformId: 'revolut',
        type: 'fixed',
        value: 100,
        note: 'Inicio año',
      });

      // Verify all changes
      const oct = service.getSalaryAllocationsByMonth(2026, 10);
      expect(oct.find(a => a.id === 'sa-future-4')!.value).toBe(50);

      const nov = service.getSalaryAllocationsByMonth(2026, 11);
      expect(nov.some(a => a.id === 'sa-future-5')).toBeFalse();

      const jan = service.getSalaryAllocationsByMonth(2027, 1);
      expect(jan.some(a => a.id === 'sa-jan-2027')).toBeTrue();
      expect(jan.find(a => a.id === 'sa-jan-2027')!.platformId).toBe('revolut');

      // Unmodified months should be intact
      const jul = service.getSalaryAllocationsByMonth(2026, 7);
      expect(jul.find(a => a.id === 'sa-future-1')!.value).toBe(21);
    });
  });
});
