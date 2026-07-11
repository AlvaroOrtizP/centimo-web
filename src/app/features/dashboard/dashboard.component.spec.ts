import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render summary cards', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Patrimonio Neto');
    expect(el.textContent).toContain('Ingresos del Mes');
    expect(el.textContent).toContain('Gastos del Mes');
    expect(el.textContent).toContain('Ahorro Neto');
  });

  it('should render platform table', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Plataformas');
  });

  it('should render net worth chart', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Evolución Patrimonio');
  });

  it('should render expenses chart', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Gastos Acumulados');
  });

  describe('Valores de junio 2026 (mock data)', () => {
    it('should compute totalIncome from interest-bearing accounts', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const summary = component['service'].monthlySummary();
      // revolut 15.50 + b100-savings 8.40 + b100-investment 12.30 + mintos 50 + myinvestor-investment 63.70
      expect(summary.totalIncome).toBeCloseTo(149.9, 1);
    });

    it('should compute totalExpenses from gastos snapshot', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const summary = component['service'].monthlySummary();
      expect(summary.totalExpenses).toBe(890);
    });

    it('should compute balanceWithoutExpenses', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;
      const summary = component['service'].monthlySummary();
      // 4250+1200+7700+2800+4500+3100+1500+2200+1750+1800 = 30800
      expect(summary.balanceWithoutExpenses).toBe(30800);
    });

    it('should show correct platform balances', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const platformBalances = el.querySelectorAll('.text-right .text-sm.font-semibold');
      const values = Array.from(platformBalances).map(c => c.textContent?.trim());
      expect(values).toContain('4250 €');
      expect(values).toContain('8900 €');
      expect(values).toContain('3100 €');
      expect(values).toContain('1500 €');
      expect(values).toContain('2200 €');
      expect(values).toContain('1750 €');
      expect(values).toContain('1800 €');
    });

    it('should show income values for accounts with income', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const incomeSpans = el.querySelectorAll('.text-right .text-green-600');
      const values = Array.from(incomeSpans).map(s => s.textContent?.trim());
      // B100: 8.40 + 12.30 = 20.70 → "20,7"
      expect(values).toContain('+20,7');
      // Revolut: 15.50 → "15,5"
      expect(values).toContain('+15,5');
      // Mintos: 50 → "50"
      expect(values).toContain('+50');
      // MyInvestor: 63.70 → "63,7"
      expect(values).toContain('+63,7');
    });

    it('should show expense value for gastos platform', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const expenseSpans = el.querySelectorAll('.text-right .text-red-600');
      const values = Array.from(expenseSpans).map(s => s.textContent?.trim());
      expect(values).toContain('890 €');
    });

    it('should compute all summary card values correctly', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.text-2xl');
      const values = Array.from(cards).map(c => c.textContent?.trim());
      expect(values).toContain('30.800 €');
      expect(values).toContain('150 €');
      expect(values).toContain('890 €');
      expect(values).toContain('-740 €');
    });
  });
});
