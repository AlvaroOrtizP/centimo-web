import { TestBed } from '@angular/core/testing';

import { provideApiMocks } from '../../../core/testing/api-mocks';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: provideApiMocks(),
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit menuClick when hamburger is clicked', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    let emitted = false;
    fixture.componentInstance.menuClick.subscribe(() => emitted = true);
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button).toBeTruthy();
    button!.click();
    expect(emitted).toBeTrue();
  });
});
