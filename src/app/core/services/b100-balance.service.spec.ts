import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { B100BalanceDataService } from './b100-balance.service';
import { B100Balance } from '../../models';
import { B100BalanceResponse } from '../../api/generated/model/b100BalanceResponse';

describe('B100BalanceDataService', () => {
  let service: B100BalanceDataService;
  let httpMock: HttpTestingController;

  const saveBalance: B100Balance = {
    id: 'save-2026-08',
    tipoSubcuenta: 'save',
    mes: '2026-08',
    balanceMensual: 3000,
    dineroTotalRepartir: 12,
    aporteMensual: 100,
    dineroHacienda: 2.28,
    porcentajeHacienda: 19,
  };

  const healthBalance: B100Balance = {
    id: 'health-2026-08',
    tipoSubcuenta: 'health',
    mes: '2026-08',
    balanceMensual: 5000,
    dineroTotalRepartir: 20,
    aporteMensual: 200,
    dineroHacienda: 3.8,
    porcentajeHacienda: 19,
  };

  const response = (overrides: Partial<B100BalanceResponse> = {}): B100BalanceResponse => ({
    id: 'save-2026-08',
    tipoSubcuenta: 'save',
    mes: '2026-08',
    balanceMensual: 3000,
    dineroTotalRepartir: 12,
    aporteMensual: 100,
    dineroHacienda: 2.28,
    porcentajeHacienda: 19,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(B100BalanceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toMes formatea el mes como YYYY-MM', () => {
    expect(B100BalanceDataService.toMes(2026, 9)).toBe('2026-09');
    expect(B100BalanceDataService.toMes(2026, 12)).toBe('2026-12');
  });

  it('getBalancesByTipo y getBalance filtran por subcuenta y mes', () => {
    service.balances.set([saveBalance, healthBalance]);

    expect(service.getBalancesByTipo('save')).toEqual([saveBalance]);
    expect(service.getBalancesByTipo('health')).toEqual([healthBalance]);
    expect(service.getBalance('save', 2026, 8)).toEqual(saveBalance);
    expect(service.getBalance('health', 2026, 8)).toEqual(healthBalance);
    expect(service.getBalance('save', 2026, 9)).toBeUndefined();
  });

  it('loadHistory llama al GET con tipoSubcuenta, mes, limit y order', () => {
    service.loadHistory('save', 2026, 8);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/b100-balances'));
    expect(req.request.params.get('tipoSubcuenta')).toBe('save');
    expect(req.request.params.get('mes')).toBe('2026-08');
    expect(req.request.params.get('limit')).toBe('12');
    expect(req.request.params.get('order')).toBe('desc');

    req.flush([response()]);

    expect(service.balances()).toEqual([saveBalance]);
  });

  it('loadHistory conserva los balances de la otra subcuenta', () => {
    service.balances.set([healthBalance]);

    service.loadHistory('save', 2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/b100-balances')).flush([response()]);

    expect(service.balances()).toEqual([healthBalance, saveBalance]);
  });

  it('loadHistory no repite la llamada si ya carga desde el mismo mes', () => {
    service.loadHistory('save', 2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/b100-balances')).flush([response({ mes: '2026-07' })]);

    service.loadHistory('save', 2026, 8);

    expect(service.balances()).toEqual([jasmine.objectContaining({ mes: '2026-07' })]);
    httpMock.expectNone(r => r.method === 'GET' && r.url.endsWith('/b100-balances'));
  });

  it('loadHistory recarga cuando cambia el mes de partida', () => {
    service.loadHistory('save', 2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/b100-balances')).flush([response()]);

    service.loadHistory('save', 2026, 9);
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/b100-balances'));
    expect(req.request.params.get('mes')).toBe('2026-09');
    req.flush([response({ id: 'save-2026-09', mes: '2026-09', balanceMensual: 3200 })]);

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: 'save-2026-09', balanceMensual: 3200 })]);
  });

  it('save hace POST (create) cuando no existe balance para la subcuenta y mes', () => {
    const data = { balanceMensual: 3000, dineroTotalRepartir: 12, aporteMensual: 100, dineroHacienda: 2.28, porcentajeHacienda: 19 };

    let result: B100Balance | undefined;
    service.save('save', 2026, 8, data).subscribe(b => (result = b));

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/b100-balances'));
    expect(req.request.body).toEqual({ tipoSubcuenta: 'save', mes: '2026-08', ...data });
    req.flush(response());

    expect(result).toEqual(saveBalance);
    expect(service.balances()).toEqual([saveBalance]);
  });

  it('save hace PUT con el id cuando ya existe balance para la subcuenta y mes', () => {
    service.balances.set([saveBalance]);
    const data = { balanceMensual: 3100, dineroTotalRepartir: 15, aporteMensual: 100, dineroHacienda: 2.85, porcentajeHacienda: 19 };

    service.save('save', 2026, 8, data).subscribe();

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url.endsWith('/b100-balances/save-2026-08'));
    expect(req.request.body).toEqual({ tipoSubcuenta: 'save', mes: '2026-08', ...data });
    req.flush({ ...response(), balanceMensual: 3100 });

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: 'save-2026-08', balanceMensual: 3100 })]);
  });

  it('delete llama al DELETE con el id y elimina el balance local', () => {
    service.balances.set([saveBalance, healthBalance]);

    service.delete('save-2026-08').subscribe();

    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/b100-balances/save-2026-08'));
    req.flush({});

    expect(service.balances()).toEqual([healthBalance]);
  });
});