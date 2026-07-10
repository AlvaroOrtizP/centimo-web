import { TestBed } from '@angular/core/testing';

import { SummaryCardsComponent } from './summary-cards.component';

describe('SummaryCardsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryCardsComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SummaryCardsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render 4 cards with values', () => {
    const fixture = TestBed.createComponent(SummaryCardsComponent);
    fixture.componentRef.setInput('summary', { totalBalance: 10000, totalIncome: 3000, totalExpenses: 2000, netSavings: 1000, netWorth: 10000 });
    fixture.componentRef.setInput('previousSummary', { totalBalance: 9000, totalIncome: 2500, totalExpenses: 1800, netSavings: 700, netWorth: 9000 });
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Patrimonio Neto');
    expect(el.textContent).toContain('Ingresos del Mes');
    expect(el.textContent).toContain('Gastos del Mes');
    expect(el.textContent).toContain('Ahorro Neto');
  });
});
