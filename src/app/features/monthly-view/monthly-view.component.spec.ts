import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MonthlyViewComponent } from './monthly-view.component';

describe('MonthlyViewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyViewComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MonthlyViewComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render month title', () => {
    const fixture = TestBed.createComponent(MonthlyViewComponent);
    fixture.componentRef.setInput('year', '2026');
    fixture.componentRef.setInput('month', '6');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Junio 2026');
  });

  it('should render summary cards', () => {
    const fixture = TestBed.createComponent(MonthlyViewComponent);
    fixture.componentRef.setInput('year', '2026');
    fixture.componentRef.setInput('month', '6');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Balance Total');
    expect(el.textContent).toContain('Ingresos');
    expect(el.textContent).toContain('Gastos');
  });
});
