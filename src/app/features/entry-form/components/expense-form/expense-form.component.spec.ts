import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ExpenseFormComponent } from './expense-form.component';
import { FinancialDataService } from '../../../../core/services/financial-data.service';
import { ExpensesService } from '../../../../api/generated/api/expenses.service';
import { SnapshotsService } from '../../../../api/generated/api/snapshots.service';
import { Expense } from '../../../../models/expense';
import { ExpenseCategory } from '../../../../models/expense-category';
import { MonthlySnapshot } from '../../../../models/monthly-snapshot';

describe('ExpenseFormComponent', () => {
  let fixture: ComponentFixture<ExpenseFormComponent>;
  let component: ExpenseFormComponent;
  let service: FinancialDataService;
  let expensesApi: jasmine.SpyObj<ExpensesService>;
  let snapshotsApi: jasmine.SpyObj<SnapshotsService>;

  const julyExpenses: Expense[] = [
    { id: 'exp-jul-1', snapshotId: 'snap-jul', category: ExpenseCategory.Comida, amount: 25, date: '2026-07-05', description: 'Mercadona' },
    { id: 'exp-jul-2', snapshotId: 'snap-jul', category: ExpenseCategory.Ocio, amount: 10, date: '2026-07-10', description: 'Cine' },
  ];

  beforeEach(async () => {
    expensesApi = jasmine.createSpyObj('ExpensesService', ['listExpenses', 'createExpense', 'deleteExpense', 'updateExpense']);
    snapshotsApi = jasmine.createSpyObj('SnapshotsService', ['listSnapshots', 'createSnapshot', 'upsertSnapshot', 'getSnapshotByAccountAndDate']);

    expensesApi.listExpenses.and.callFake((snapshotId?: string) => {
      if (snapshotId === 'snap-jul') {
        return of(julyExpenses) as never;
      }
      return of([]) as never;
    });
    expensesApi.createExpense.and.callFake((create: never) => of({ ...(create as object), id: 'exp-new' }) as never);
    snapshotsApi.createSnapshot.and.callFake((s: never) => of({ ...(s as object), id: 'snap-jul' }) as never);
    snapshotsApi.upsertSnapshot.and.callFake((s: never) => of({ ...(s as object), id: (s as { month: number }).month === 8 ? 'snap-aug' : 'snap-jul' }) as never);

    await TestBed.configureTestingModule({
      imports: [FormsModule, ExpenseFormComponent],
      providers: [
        provideHttpClient(),
        { provide: ExpensesService, useValue: expensesApi },
        { provide: SnapshotsService, useValue: snapshotsApi },
      ],
    }).compileComponents();

    service = TestBed.inject(FinancialDataService);
    service.addSnapshot({ id: 'snap-jul', accountId: 'bbva-gasto', year: 2026, month: 7, balance: 0, income: 0, expenses: 0 });
    service.addExpense(julyExpenses[0]).subscribe();
    service.addExpense(julyExpenses[1]).subscribe();

    fixture = TestBed.createComponent(ExpenseFormComponent);
    fixture.componentRef.setInput('year', 2026);
    fixture.componentRef.setInput('month', 7);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show July expenses by default', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mercadona');
    expect(text).toContain('Cine');
  }));

  function setListMonth(month: number): void {
    (component as unknown as { listMonth: { set: (m: number) => void } }).listMonth.set(month);
  }

  it('should keep July expenses cached when switching to a month without records and back', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    setListMonth(8);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const augustText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(augustText).toContain('No hay gastos registrados');

    setListMonth(7);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const julyText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(julyText).toContain('Mercadona');
    expect(julyText).toContain('Cine');
  }));

  it('should keep July expenses even if the July reload returns empty', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    setListMonth(8);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expensesApi.listExpenses.and.callFake(() => of([]) as never);
    setListMonth(7);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const julyText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(julyText).toContain('Mercadona');
  }));

  it('should keep July expenses when switching the month picker to August and back', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const initial = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(initial).toContain('Mercadona');

    fixture.componentRef.setInput('month', 8);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const augustText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(augustText).toContain('No hay gastos registrados');

    fixture.componentRef.setInput('month', 7);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const julyText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(julyText).toContain('Mercadona');
    expect(julyText).toContain('Cine');
  }));

  it('should still show July when the select writes a string month value', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    const setListMonthRaw = (m: number | string): void => {
      (component as unknown as { listMonth: { set: (value: number | string) => void } }).listMonth.set(m);
    };

    setListMonthRaw('8');
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const augustText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(augustText).toContain('No hay gastos registrados');

    setListMonthRaw('7');
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    const julyText = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(julyText).toContain('Mercadona');
    expect(julyText).toContain('Cine');
  }));
});
