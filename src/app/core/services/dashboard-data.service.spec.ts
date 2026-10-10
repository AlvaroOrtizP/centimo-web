import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardDataService } from './dashboard-data.service';
import { DashboardCategoria } from '../../api/generated/model/dashboardCategoria';

describe('DashboardDataService', () => {
  let service: DashboardDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toMes formatea el mes como YYYY-MM', () => {
    expect(DashboardDataService.toMes(2026, 9)).toBe('2026-09');
    expect(DashboardDataService.toMes(2026, 12)).toBe('2026-12');
    expect(DashboardDataService.toMes(2025, 1)).toBe('2025-01');
  });

  it('loadBalance llama al GET con mes y guarda en cache', () => {
    service.loadBalance('2026-08');

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances'));
    expect(req.request.params.get('mes')).toBe('2026-08');

    req.flush({
      mes: '2026-08',
      total: 1000,
      entidades: [{ codigo: 'revolut', nombre: 'Revolut', balance: 1000, aporte: 0 }],
    });

    expect(service.getBalance('2026-08')?.total).toBe(1000);
  });

  it('loadBalance no repite la llamada si ya hay dato del mes', () => {
    service.loadBalance('2026-08');
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances')).flush({
      mes: '2026-08', total: 1000, entidades: [],
    });

    service.loadBalance('2026-08');

    expect(service.getBalance('2026-08')?.total).toBe(1000);
    httpMock.expectNone(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances'));
  });

  it('loadBalance recarga cuando el mes cambia', () => {
    service.loadBalance('2026-08');
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances')).flush({
      mes: '2026-08', total: 1000, entidades: [],
    });

    service.loadBalance('2026-09');
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances')).flush({
      mes: '2026-09', total: 2000, entidades: [],
    });

    expect(service.getBalance('2026-08')?.total).toBe(1000);
    expect(service.getBalance('2026-09')?.total).toBe(2000);
  });

  it('loadSerie sin entidad llama al GET con mes y mesesAtras', () => {
    service.loadSerie(undefined, '2026-08', 6);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances/serie'));
    expect(req.request.params.get('mes')).toBe('2026-08');
    expect(req.request.params.get('mesesAtras')).toBe('6');
    expect(req.request.params.has('entidad')).toBe(false);

    req.flush([
      { mes: '2026-02', balance: 900, aporte: 100 },
      { mes: '2026-08', balance: 1000, aporte: 100 },
    ]);

    expect(service.getSerie(undefined, '2026-08', 6)?.length).toBe(2);
    expect(service.getSerie(undefined, '2026-08', 6)?.at(-1)?.balance).toBe(1000);
  });

  it('loadSerie con entidad incluye el parámetro entidad', () => {
    service.loadSerie('b100', '2026-08', 6);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances/serie'));
    expect(req.request.params.get('entidad')).toBe('b100');
    req.flush([]);
  });

  it('loadSerie distingue cache por entidad y mesesAtras', () => {
    service.loadSerie('b100', '2026-08');
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances/serie')).flush([
      { mes: '2026-08', balance: 100, aporte: 10 },
    ]);

    service.loadSerie('b100', '2026-08', 3);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances/serie')).flush([]);

    expect(service.getSerie('b100', '2026-08')?.length).toBe(1);
  });

  it('loadSerieCategoria llama al GET con categoria, mes y mesesAtras', () => {
    service.loadSerieCategoria(DashboardCategoria.Liquidez, '2026-08', 6);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/categorias/serie'));
    expect(req.request.params.get('categoria')).toBe('Liquidez');
    expect(req.request.params.get('mes')).toBe('2026-08');
    expect(req.request.params.get('mesesAtras')).toBe('6');

    req.flush([
      { mes: '2026-08', codigo: 'revolut', balance: 1000, aporte: 0 },
      { mes: '2026-08', codigo: 'bbva', balance: 500, aporte: 100 },
    ]);

    const serie = service.getSerieCategoria(DashboardCategoria.Liquidez, '2026-08', 6);
    expect(serie?.length).toBe(2);
    expect(serie?.at(0)?.codigo).toBe('revolut');
  });

  it('clearCache vacía todos los caches y permite recargar', () => {
    service.loadBalance('2026-08');
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances')).flush({
      mes: '2026-08', total: 1000, entidades: [],
    });

    service.clearCache();
    expect(service.getBalance('2026-08')).toBeUndefined();

    service.loadBalance('2026-08');
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/dashboard/balances')).flush({
      mes: '2026-08', total: 2000, entidades: [],
    });
    expect(service.getBalance('2026-08')?.total).toBe(2000);
  });
});