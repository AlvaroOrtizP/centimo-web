import { TestBed } from '@angular/core/testing';

import { provideApiMocks } from '../../core/testing/api-mocks';
import { TradeLogComponent } from './trade-log.component';

describe('TradeLogComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeLogComponent],
      providers: provideApiMocks(),
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TradeLogComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render entrada and historial tabs with historial active by default', () => {
    const fixture = TestBed.createComponent(TradeLogComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(el.querySelectorAll('button')).map(b => b.textContent?.trim());
    expect(buttons).toContain('Entrada');
    expect(buttons).toContain('Historial');
    expect(el.textContent).toContain('Total Invertido');
  });

  it('should render summary and table', () => {
    const fixture = TestBed.createComponent(TradeLogComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Total Invertido');
    expect(el.textContent).toContain('Total Retirado');
    expect(el.textContent).toContain('P&L Global');
    expect(el.textContent).toContain('P&L por Plataforma');
  });

  it('should render filter selects', () => {
    const fixture = TestBed.createComponent(TradeLogComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const selects = el.querySelectorAll('select');
    expect(selects.length).toBe(3);
  });

  it('should show the trade entry form when switching to Entrada tab', () => {
    const fixture = TestBed.createComponent(TradeLogComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const entradaButton = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Entrada');
    expect(entradaButton).toBeTruthy();
    entradaButton?.click();
    fixture.detectChanges();
    expect(el.textContent).toContain('Registrar operación');
    expect(el.textContent).toContain('Registrar compra');
  });
});
