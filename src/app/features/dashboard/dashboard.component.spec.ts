import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DashboardComponent } from './dashboard.component';
import { FinancialDataService } from '../../core/services/financial-data.service';
import { ExpenseCategory } from '../../models/expense-category';
import { provideApiMocks } from '../../core/testing/api-mocks';
import { configureSeedSpies, applyFinancialSeed } from '../../core/testing/test-seed';

describe('DashboardComponent', () => {
  let service: FinancialDataService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [provideRouter([]), ...provideApiMocks()],
    }).compileComponents();
    configureSeedSpies();
    service = applyFinancialSeed();
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

  it('resetView clears selected platform and restores total chart mode', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const comp = fixture.componentInstance as any;
    comp.selectedPlatformId.set('myinvestor');
    comp.chartMode.set('per-platform');
    fixture.detectChanges();
    expect(comp.selectedPlatformId()).toBe('myinvestor');

    comp.resetView();
    fixture.detectChanges();

    expect(comp.selectedPlatformId()).toBeNull();
    expect(comp.chartMode()).toBe('total');
  });

  // ──────────────────────────────────────────────────────────
  // FASE 1 — Valores iniciales (datos existentes en JSON)
  // ──────────────────────────────────────────────────────────
  describe('Fase 1 — Valores iniciales junio 2026', () => {
    it('should compute totalIncome from interest-bearing accounts', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      const summary = service.monthlySummary();
      // revolut 15.50 + b100-savings 8.40 + b100-investment 12.30 + mintos 50 + myinvestor-fondo 63.70
      expect(summary.totalIncome).toBeCloseTo(149.9, 1);
    });

    it('should compute totalExpenses from gastos snapshot', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      expect(service.monthlySummary().totalExpenses).toBe(890);
    });

    it('should compute balanceWithoutExpenses', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.detectChanges();
      expect(service.monthlySummary().balanceWithoutExpenses).toBe(30800);
    });

    it('should show MyInvestor total as 8900 € (fondos 7700 + metal 1200)', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      setDashboardMonth(fixture.componentInstance, 2026, 6);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const platformBalances = el.querySelectorAll('.text-right .font-semibold');
      const values = Array.from(platformBalances).map(c => c.textContent?.trim());
      expect(values).toContain('8900 €');
    });

    it('should show correct income values', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      setDashboardMonth(fixture.componentInstance, 2026, 6);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const incomeSpans = el.querySelectorAll('.text-right .text-green-600');
      const values = Array.from(incomeSpans).map(s => s.textContent?.trim());
      expect(values).toContain('+20,7');
      expect(values).toContain('+15,5');
      expect(values).toContain('+50');
      expect(values).toContain('+63,7');
    });

    it('should show monthly expenses only in the gastos row of platform table', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      setDashboardMonth(fixture.componentInstance, 2026, 6);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      const table = el.querySelector('app-platform-summary-table');
      const expenseValues = Array.from(table?.querySelectorAll('.text-right .text-red-600') ?? []).map(s => s.textContent?.trim());
      expect(expenseValues).toEqual(['890 €']);
    });

    it('should compute all summary card values correctly', () => {
      const fixture = TestBed.createComponent(DashboardComponent);
      setDashboardMonth(fixture.componentInstance, 2026, 6);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.text-lg.font-bold');
      const values = Array.from(cards).map(c => c.textContent?.trim());
      expect(values).toContain('30.800 €');
      expect(values).toContain('150 €');
      expect(values).toContain('890 €');
      expect(values).toContain('-740 €');
    });
  });

  // ──────────────────────────────────────────────────────────
  // FASE 2 + 3 — Añadir fondo y verificar dashboard
  // ──────────────────────────────────────────────────────────
  describe('Fase 2+3 — Añadir fondo y verificar en dashboard', () => {
    it('should create a new fund, update snapshot, and reflect in dashboard', () => {
      // ── FASE 2: añadir fondo + balance ──
      const fundsBefore = service.myInvestorFunds().length;

      service.addMyInvestorFund({
        id: 'mif-test-001',
        code: 'IE0002XZSHO5',
        name: 'Amundi MSCI World',
      }).subscribe();

      service.addFundBalance({
        id: 'fb-test-001',
        fundId: 'mif-test-001',
        year: 2026,
        month: 6,
        balance: 4200,
      }).subscribe();

      // Sync: recalcular total fondos → actualizar snapshot myinvestor-fondo
      const totalFunds = service.getTotalFundBalanceForMonth(2026, 6);
      const snap = service.getSnapshot('myinvestor-fondo', 2026, 6);
      if (snap) {
        service.updateSnapshot(snap.id, { balance: totalFunds });
      }

      // Verificaciones de Fase 2
      expect(service.myInvestorFunds().length).toBe(fundsBefore + 1);

      const newFund = service.myInvestorFunds().find(f => f.id === 'mif-test-001');
      expect(newFund).toBeDefined();
      expect(newFund!.name).toBe('Amundi MSCI World');

      const newBalance = service.getFundBalance('mif-test-001', 2026, 6);
      expect(newBalance).toBeDefined();
      expect(newBalance!.balance).toBe(4200);
      expect(totalFunds).toBe(13100);

      // ── FASE 3: verificar dashboard ──
      const fixture = TestBed.createComponent(DashboardComponent);
      setDashboardMonth(fixture.componentInstance, 2026, 6);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // MyInvestor: fondos 7700 + metal 1200 + nuevo 4200 = 13100
      const platformBalances = el.querySelectorAll('.text-right .font-semibold');
      const values = Array.from(platformBalances).map(c => c.textContent?.trim());
      expect(values).toContain('13.100 €');

      // balanceWithoutExpenses: 30800 + 4200 = 35000
      expect(service.monthlySummary().balanceWithoutExpenses).toBe(35000);

      // Income sin cambios (no se introdujo rentabilidad para el nuevo fondo)
      expect(service.monthlySummary().totalIncome).toBeCloseTo(149.9, 1);

      // Gastos sin cambios
      expect(service.monthlySummary().totalExpenses).toBe(890);
    });
  });

  // ──────────────────────────────────────────────────────────
  // FASE 4 + 5 — Datos julio 2026 y verificar dashboard
  // ──────────────────────────────────────────────────────────
  describe('Fase 4+5 — Datos julio 2026 y verificar dashboard', () => {
    it('should add data for July and verify dashboard reflects changes', fakeAsync(() => {
      // ── FASE 4: añadir fondos + balances para julio ──
      service.addMyInvestorFund({
        id: 'mif-phase2-001',
        code: 'IE0002XZSHO5',
        name: 'Amundi MSCI World',
      }).subscribe();
      service.addMyInvestorFund({
        id: 'mif-phase4-001',
        code: 'IE00BFMXXD54',
        name: 'Amundi S&P 500',
      }).subscribe();

      service.addFundBalance({ id: 'fb-jul-idx', fundId: 'mif-001', year: 2026, month: 7, balance: 5000 }).subscribe();
      service.addFundBalance({ id: 'fb-jul-van', fundId: 'mif-002', year: 2026, month: 7, balance: 3500 }).subscribe();
      service.addFundBalance({ id: 'fb-jul-msci', fundId: 'mif-phase2-001', year: 2026, month: 7, balance: 4500 }).subscribe();
      service.addFundBalance({ id: 'fb-jul-sp500', fundId: 'mif-phase4-001', year: 2026, month: 7, balance: 7000 }).subscribe();
      service.addFundBalance({ id: 'fb-jul-metal', fundId: 'mif-metal', year: 2026, month: 7, balance: 1500 }).subscribe();

      const totalFunds = service.getTotalFundBalanceForMonth(2026, 7);
      expect(totalFunds).toBe(21500);

      // Verificaciones Fase 4 — fondos
      expect(service.myInvestorFunds().length).toBe(5);
      expect(service.fundBalances().filter(f => f.year === 2026 && f.month === 7).length).toBe(5);

      // ── FASE 4: snapshots para julio ──
      const julySnapshots = [
        { id: 'bbva-checking-2026-07', accountId: 'bbva-checking', year: 2026, month: 7, balance: 5000, income: 0, expenses: 0 },
        { id: 'myinvestor-checking-2026-07', accountId: 'myinvestor-checking', year: 2026, month: 7, balance: 0, income: 0, expenses: 0 },
        { id: 'myinvestor-fondo-2026-07', accountId: 'myinvestor-fondo', year: 2026, month: 7, balance: totalFunds, income: 87, expenses: 0 },
        { id: 'b100-checking-2026-07', accountId: 'b100-checking', year: 2026, month: 7, balance: 0, income: 0, expenses: 0 },
        { id: 'b100-savings-2026-07', accountId: 'b100-savings', year: 2026, month: 7, balance: 3000, income: 10, expenses: 0 },
        { id: 'b100-investment-2026-07', accountId: 'b100-investment', year: 2026, month: 7, balance: 5000, income: 15, expenses: 0 },
        { id: 'revolut-main-2026-07', accountId: 'revolut-main', year: 2026, month: 7, balance: 3500, income: 18, expenses: 0 },
        { id: 'mintos-main-2026-07', accountId: 'mintos-main', year: 2026, month: 7, balance: 1500, income: 70, expenses: 0 },
        { id: 'equito-main-2026-07', accountId: 'equito-main', year: 2026, month: 7, balance: 2500, income: 0, expenses: 0 },
        { id: 'urbanitae-main-2026-07', accountId: 'urbanitae-main', year: 2026, month: 7, balance: 2000, income: 0, expenses: 0 },
        { id: 'etoro-main-2026-07', accountId: 'etoro-main', year: 2026, month: 7, balance: 0, income: 0, expenses: 0 },
        { id: 'bitvavo-main-2026-07', accountId: 'bitvavo-main', year: 2026, month: 7, balance: 0, income: 0, expenses: 0 },
        { id: 'caixa-main-2026-07', accountId: 'caixa-main', year: 2026, month: 7, balance: 2000, income: 0, expenses: 0 },
        { id: 'gastos-main-2026-07', accountId: 'gastos-main', year: 2026, month: 7, balance: 0, income: 0, expenses: 800 },
      ];
      julySnapshots.forEach(s => service.addSnapshot(s));
      tick();

      expect(service.getSnapshotsByMonth(2026, 7).length).toBe(14);

      // ── FASE 4: gastos para julio ──
      service.addExpense({
        id: 'exp-comida-jul-001',
        snapshotId: 'gastos-main-2026-07',
        category: ExpenseCategory.Comida,
        amount: 450,
        date: '2026-07-10',
        description: 'Supermercado y restaurantes julio',
      }).subscribe();
      service.addExpense({
        id: 'exp-coche-jul-001',
        snapshotId: 'gastos-main-2026-07',
        category: ExpenseCategory.Coche,
        amount: 350,
        date: '2026-07-20',
        description: 'Gasolina y mantenimiento julio',
      }).subscribe();
      tick();

      expect(service.getExpensesBySnapshot('gastos-main-2026-07').length).toBe(2);

      // El efecto solo auto-ajusta una vez: fijar el mes visible a julio
      service.currentYear.set(2026);
      service.currentMonth.set(7);

      // ── FASE 5: verificar dashboard para julio ──
      const fixture = TestBed.createComponent(DashboardComponent);
      setDashboardMonth(fixture.componentInstance, 2026, 7);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      // Resumen: totalBalance 46000, income 200, expenses 800, netSavings -600
      const cards = el.querySelectorAll('.text-lg.font-bold');
      const cardValues = Array.from(cards).map(c => c.textContent?.trim());
      expect(cardValues).toContain('46.000 €');
      expect(cardValues).toContain('200 €');
      expect(cardValues).toContain('800 €');
      expect(cardValues).toContain('-600 €');

      // MyInvestor: fondos 20000 + metal 1500 = 21500
      const platformBalances = el.querySelectorAll('.text-right .font-semibold');
      const balanceValues = Array.from(platformBalances).map(c => c.textContent?.trim());
      expect(balanceValues).toContain('21.500 €');

      // Income: myinvestor 87, b100-savings 10, b100-investment 15, revolut 18, mintos 70
      const incomeSpans = el.querySelectorAll('.text-right .text-green-600');
      const incomeValues = Array.from(incomeSpans).map(s => s.textContent?.trim());
      expect(incomeValues).toContain('+87');
      expect(incomeValues).toContain('+18');
      expect(incomeValues).toContain('+70');

      // Expenses: fila "Gastos" con el total del mes en la tabla de plataformas
      const table = el.querySelector('app-platform-summary-table');
      const expenseValues = Array.from(table?.querySelectorAll('.text-right .text-red-600') ?? []).map(s => s.textContent?.trim());
      expect(expenseValues).toEqual(['800 €']);

      // Summary computed
      const summary = service.monthlySummary();
      expect(summary.totalBalance).toBe(46000);
      expect(summary.totalIncome).toBe(200);
      expect(summary.totalExpenses).toBe(800);
      expect(summary.balanceWithoutExpenses).toBe(46000);
      expect(summary.netSavings).toBe(-600);
    }));
  });
});

function setDashboardMonth(component: DashboardComponent, year: number, month: number): void {
  (component as unknown as {
    service: { currentYear: { set(value: number): void }; currentMonth: { set(value: number): void } };
  }).service.currentYear.set(year);
  (component as unknown as {
    service: { currentYear: { set(value: number): void }; currentMonth: { set(value: number): void } };
  }).service.currentMonth.set(month);
}
