import { TestBed } from '@angular/core/testing';

import { CollapsibleDescriptionComponent } from './collapsible-description.component';

describe('CollapsibleDescriptionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapsibleDescriptionComponent],
    }).compileComponents();
    localStorage.clear();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CollapsibleDescriptionComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show description initially', () => {
    const fixture = TestBed.createComponent(CollapsibleDescriptionComponent);
    fixture.componentRef.setInput('description', 'Texto de prueba');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Texto de prueba');
  });

  it('should hide description when toggle is clicked', () => {
    const fixture = TestBed.createComponent(CollapsibleDescriptionComponent);
    fixture.componentRef.setInput('description', 'Texto de prueba');
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button).toBeTruthy();
    button!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Texto de prueba');
  });

  it('should show description again when toggled twice', () => {
    const fixture = TestBed.createComponent(CollapsibleDescriptionComponent);
    fixture.componentRef.setInput('description', 'Texto de prueba');
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button!.click();
    fixture.detectChanges();
    button!.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Texto de prueba');
  });
});
