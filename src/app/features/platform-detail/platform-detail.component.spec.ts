import { TestBed } from '@angular/core/testing';

import { PlatformDetailComponent } from './platform-detail.component';

describe('PlatformDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformDetailComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlatformDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show platform name when id is provided', () => {
    const fixture = TestBed.createComponent(PlatformDetailComponent);
    fixture.componentRef.setInput('id', 'bbva');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('BBVA');
  });

  it('should show "no encontrada" for unknown id', () => {
    const fixture = TestBed.createComponent(PlatformDetailComponent);
    fixture.componentRef.setInput('id', 'unknown');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Plataforma no encontrada');
  });

  it('should render balance chart for a valid platform', () => {
    const fixture = TestBed.createComponent(PlatformDetailComponent);
    fixture.componentRef.setInput('id', 'bbva');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Evolución del Balance');
  });

  it('should render monthly table', () => {
    const fixture = TestBed.createComponent(PlatformDetailComponent);
    fixture.componentRef.setInput('id', 'bbva');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Historial Mensual');
  });
});
