import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UrbanitaeBalanceDataService } from './urbanitae-balance.service';
import { UrbanitaeBalance } from '../../models';
import { UrbanitaeBalanceResponse } from '../../api/generated/model/urbanitaeBalanceResponse';

describe('UrbanitaeBalanceDataService', () => {
  let service: UrbanitaeBalanceDataService;
  let httpMock: HttpTestingController;

  const augustBalance: UrbanitaeBalance = {
    id: '2026-08',
    mes: '2026-08',
    balanceMensual: 5000,
    aporteMensual: 100,
    dineroTotal: 15,
    dineroHacienda: 2.85,
    dineroFinal: 12.15,
  };

  const response = (overrides: Partial<UrbanitaeBalanceResponse> = {}): UrbanitaeBalanceResponse => ({
    id: '2026-08',
    mes: '2026-08',
    balanceMensual: 5000,
    aporteMensual: 100,
    dineroTotal: 15,
    dineroHacienda: 2.85,
    dineroFinal: 12.15,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UrbanitaeBalanceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toMes formatea el mes como YYYY-MM', () => {
    expect(UrbanitaeBalanceDataService.toMes(2026, 9)).toBe('2026-09');
    expect(UrbanitaeBalanceDataService.toMes(2026, 12)).toBe('2026-12');
  });

  it('getBalances y getBalance devuelven los balances del mes', () => {
    service.balances.set([augustBalance]);

    expect(service.getBalances()).toEqual([augustBalance]);
    expect(service.getBalance(2026, 8)).toEqual(augustBalance);
    expect(service.getBalance(2026, 9)).toBeUndefined();
  });

  it('loadHistory llama al GET', () => {
    service.loadHistory(2026, 8);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/balances'));
    expect(req.request.params.get('limit')).toBeNull();

    req.flush([response()]);

    expect(service.balances()).toEqual([augustBalance]);
  });

  it('loadHistory no repite la llamada si ya carga desde el mismo mes', () => {
    service.loadHistory(2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/balances')).flush([response()]);

    service.loadHistory(2026, 8);

    expect(service.balances()).toEqual([jasmine.objectContaining({ mes: '2026-08' })]);
    httpMock.expectNone(r => r.method === 'GET' && r.url.endsWith('/urbanitae/balances'));
  });

  it('loadHistory recarga cuando cambia el mes', () => {
    service.loadHistory(2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/balances')).flush([response()]);

    service.loadHistory(2026, 9);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/balances'))
      .flush([response({ id: '2026-09', mes: '2026-09', balanceMensual: 5200, dineroFinal: 15 })]);

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: '2026-09', balanceMensual: 5200 })]);
  });

  it('save hace POST (create) cuando no existe balance para el mes', () => {
    const data = {
      balanceMensual: 5000,
      aporteMensual: 100,
      dineroTotal: 15,
      dineroHacienda: 2.85,
      dineroFinal: 12.15,
    };

    let result: UrbanitaeBalance | undefined;
    service.save(2026, 8, data).subscribe(b => (result = b));

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/urbanitae/balances'));
    expect(req.request.body).toEqual({ mes: '2026-08', ...data });
    req.flush(response());

    expect(result).toEqual(augustBalance);
    expect(service.balances()).toEqual([augustBalance]);
  });

  it('save hace PUT con el id cuando ya existe balance para el mes', () => {
    service.balances.set([augustBalance]);
    const data = { balanceMensual: 5000, aporteMensual: 200 };

    service.save(2026, 8, data).subscribe();

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url.endsWith('/urbanitae/balances/2026-08'));
    expect(req.request.body).toEqual({ mes: '2026-08', balanceMensual: 5000, aporteMensual: 200, dineroTotal: undefined, dineroHacienda: undefined, dineroFinal: undefined });
    req.flush({ ...response(), aporteMensual: 200 });

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: '2026-08', aporteMensual: 200 })]);
  });

  it('delete llama al DELETE con el id y elimina el balance local', () => {
    service.balances.set([augustBalance]);

    service.delete('2026-08').subscribe();

    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/urbanitae/balances/2026-08'));
    req.flush({});

    expect(service.balances()).toEqual([]);
  });
});