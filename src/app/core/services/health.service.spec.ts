import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('check da el back por vivo cuando /health responde 200', () => {
    let done = false;
    service.check().subscribe(() => (done = true));

    httpMock.expectOne(r => r.url.endsWith('/api/v1/health')).flush({ status: 'ok' });

    expect(done).toBe(true);
  });

  it('check considera que aún no está listo con un 503 (arrancando)', () => {
    let error: unknown;
    service.check().subscribe({ error: e => (error = e) });

    httpMock.expectOne(r => r.url.endsWith('/api/v1/health'))
      .flush({ status: 'down' }, { status: 503, statusText: 'Service Unavailable' });

    expect(error).toBeTruthy();
  });

  it('check da el back por vivo si contesta con un 404: el servidor está en pie', () => {
    let done = false;
    service.check().subscribe(() => (done = true));

    httpMock.expectOne(r => r.url.endsWith('/api/v1/health'))
      .flush('not found', { status: 404, statusText: 'Not Found' });

    expect(done).toBe(true);
  });

  it('sin /health reciente no está listo hasta que el back responde', () => {
    expect(service.isRecentlyHealthy()).toBe(false);

    let ready = false;
    service.waitUntilReady().subscribe(() => (ready = true));
    expect(ready).toBe(false);

    service.markHealthy();

    expect(ready).toBe(true);
  });

  it('markHealthy sella el caché de arranque', () => {
    service.markHealthy();

    expect(service.isRecentlyHealthy()).toBe(true);
    expect(localStorage.getItem('centimo:health-ok')).toBeTruthy();
  });

  it('el caché caduca a los 10 min (Render duerme el back a los 15)', () => {
    localStorage.setItem('centimo:health-ok', String(Date.now() - 11 * 60 * 1000));

    expect(service.isRecentlyHealthy()).toBe(false);
  });

  it('con caché reciente arranca ya listo, sin esperar a nadie', () => {
    localStorage.setItem('centimo:health-ok', String(Date.now()));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fresh = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);

    let ready = false;
    fresh.waitUntilReady().subscribe(() => (ready = true));

    expect(ready).toBe(true);
  });
});
