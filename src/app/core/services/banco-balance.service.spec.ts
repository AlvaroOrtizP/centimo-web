import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { BancoBalanceDataService } from './banco-balance.service';
import { BancoBalance } from '../../models';
import { BancoBalanceResponse } from '../../api/generated/model/bancoBalanceResponse';

describe('BancoBalanceDataService', () => {
  let service: BancoBalanceDataService;
  let httpMock: HttpTestingController;

  const bbvaAugustBalance: BancoBalance = {
    id: 'bbva-2026-08',
    entidad: 'bbva',
    mes: '2026-08',
    balanceMensual: 4000,
    aporteMensual: 100,
  };

  const response = (overrides: Partial<BancoBalanceResponse> = {}): BancoBalanceResponse => ({
    id: 'bbva-2026-08',
    entidad: 'bbva',
    mes: '2026-08',
    balanceMensual: 4000,
    aporteMensual: 100,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BancoBalanceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toMes formatea el mes como YYYY-MM', () => {
    expect(BancoBalanceDataService.toMes(2026, 9)).toBe('2026-09');
    expect(BancoBalanceDataService.toMes(2026, 12)).toBe('2026-12');
  });

  it('getBalances y getBalance filtran por entidad y mes', () => {
    service.balances.set([bbvaAugustBalance]);

    expect(service.getBalances('bbva')).toEqual([bbvaAugustBalance]);
    expect(service.getBalances('caixa')).toEqual([]);
    expect(service.getBalance('bbva', 2026, 8)).toEqual(bbvaAugustBalance);
    expect(service.getBalance('bbva', 2026, 9)).toBeUndefined();
    expect(service.getBalance('caixa', 2026, 8)).toBeUndefined();
  });

  it('loadHistory llama al GET con la entidad', () => {
    service.loadHistory('bbva', 2026, 8);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/banco/balances'));
    expect(req.request.params.get('entidad')).toBe('bbva');

    req.flush([response()]);

    expect(service.balances()).toEqual([bbvaAugustBalance]);
  });

  it('loadHistory no repite la llamada si ya cargó la misma entidad y mes', () => {
    service.loadHistory('bbva', 2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/banco/balances')).flush([response()]);

    service.loadHistory('bbva', 2026, 8);

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: 'bbva-2026-08' })]);
    httpMock.expectNone(r => r.method === 'GET' && r.url.endsWith('/banco/balances'));
  });

  it('loadHistory recarga cuando cambia la entidad', () => {
    service.loadHistory('bbva', 2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/banco/balances')).flush([response()]);

    service.loadHistory('caixa', 2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/banco/balances'))
      .flush([response({ id: 'caixa-2026-08', entidad: 'caixa', balanceMensual: 3000, aporteMensual: 50 })]);

    expect(service.balances()).toEqual([
      bbvaAugustBalance,
      jasmine.objectContaining({ id: 'caixa-2026-08', entidad: 'caixa', balanceMensual: 3000 }),
    ]);
  });

  it('save hace POST (create) cuando no existe balance para la entidad y mes', () => {
    const data = { balanceMensual: 4000, aporteMensual: 100 };

    let result: BancoBalance | undefined;
    service.save('bbva', 2026, 8, data).subscribe(b => (result = b));

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/banco/balances'));
    expect(req.request.body).toEqual({ entidad: 'bbva', mes: '2026-08', balanceMensual: 4000, aporteMensual: 100 });
    req.flush(response());

    expect(result).toEqual(bbvaAugustBalance);
    expect(service.balances()).toEqual([bbvaAugustBalance]);
  });

  it('save hace PUT con el id cuando ya existe balance para la entidad y mes', () => {
    service.balances.set([bbvaAugustBalance]);
    const data = { balanceMensual: 4000, aporteMensual: 200 };

    service.save('bbva', 2026, 8, data).subscribe();

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url.endsWith('/banco/balances/bbva-2026-08'));
    expect(req.request.body).toEqual({ entidad: 'bbva', mes: '2026-08', balanceMensual: 4000, aporteMensual: 200 });
    req.flush({ ...response(), aporteMensual: 200 });

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: 'bbva-2026-08', aporteMensual: 200 })]);
  });

  it('delete llama al DELETE con el id y elimina el balance local', () => {
    service.balances.set([bbvaAugustBalance]);

    service.delete('bbva-2026-08').subscribe();

    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/banco/balances/bbva-2026-08'));
    req.flush({});

    expect(service.balances()).toEqual([]);
  });
});