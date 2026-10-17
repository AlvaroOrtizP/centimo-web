import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { backendReadyInterceptor } from './backend-ready.interceptor';
import { BACKEND_PROBE } from './http-context.tokens';
import { HealthService } from '../services/health.service';

describe('backendReadyInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let health: HealthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([backendReadyInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    health = TestBed.inject(HealthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('retiene la petición hasta que el back está listo', () => {
    let responded = false;
    http.get('/platforms').subscribe(() => (responded = true));

    httpMock.expectNone('/platforms');
    expect(responded).toBe(false); // sigue en cola: el back no ha dado señales

    health.markHealthy();

    httpMock.expectOne('/platforms').flush([]);
    expect(responded).toBe(true); // el back arrancó y la petición sale sola
  });

  it('suelta la petición directamente si el back ya estaba listo', () => {
    health.markHealthy();

    let responded = false;
    http.get('/platforms').subscribe(() => (responded = true));

    // Sin esperar a nada: la petición ya está en la red.
    httpMock.expectOne('/platforms').flush([]);
    expect(responded).toBe(true);
  });

  it('no retiene las sondas de arranque marcadas como BACKEND_PROBE', () => {
    let responded = false;
    http.get('/api/v1/health', {
      context: new HttpContext().set(BACKEND_PROBE, true),
    }).subscribe(() => (responded = true));

    // La sonda no se retiene aunque el back aún no esté listo.
    httpMock.expectOne('/api/v1/health').flush({ status: 'ok' });
    expect(responded).toBe(true);
  });
});
