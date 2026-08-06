import { TestBed } from '@angular/core/testing';

import { provideApiMocks } from '../../core/testing/api-mocks';
import { TrendsComponent } from './trends.component';

describe('TrendsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendsComponent],
      providers: provideApiMocks(),
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TrendsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all chart sections', () => {
    const fixture = TestBed.createComponent(TrendsComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Evolución del Patrimonio Neto');
    expect(el.textContent).toContain('Ingresos vs Gastos');
    expect(el.textContent).toContain('Distribución por Plataforma');
    expect(el.textContent).toContain('Tasa de Ahorro');
  });
});
