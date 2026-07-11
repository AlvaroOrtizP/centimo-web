import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PlatformSummaryTableComponent } from './platform-summary-table.component';

describe('PlatformSummaryTableComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatformSummaryTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PlatformSummaryTableComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
