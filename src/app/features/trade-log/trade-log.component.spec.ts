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
});
