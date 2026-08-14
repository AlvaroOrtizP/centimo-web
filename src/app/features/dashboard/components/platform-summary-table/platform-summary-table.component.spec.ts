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
    fixture.componentRef.setInput('platforms', []);
    fixture.componentRef.setInput('accounts', []);
    fixture.componentRef.setInput('snapshots', []);
    fixture.componentRef.setInput('year', 2025);
    fixture.componentRef.setInput('month', 1);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
