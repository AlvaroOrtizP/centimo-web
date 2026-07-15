import { TestBed } from '@angular/core/testing';

import { MonthPickerComponent } from './month-picker.component';

describe('MonthPickerComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthPickerComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MonthPickerComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render month and year selectors', () => {
    const fixture = TestBed.createComponent(MonthPickerComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const selects = el.querySelectorAll('select');
    expect(selects.length).toBe(2);
  });
});
