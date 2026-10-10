import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MintosBalanceDataService } from './mintos-balance.service';
import { MintosBalance } from '../../models';
import { MintosInterestAnnual } from '../../api/generated/model/mintosInterestAnnual';

describe('MintosBalanceDataService', () => {
  let service: MintosBalanceDataService;
  let httpMock: HttpTestingController;

  const augustBalance: MintosBalance = {
    id: 'uuid-1',
    mes: '2026-08',
    importeAnadido: 100,
    valorFinal: 5000,
  };

  const response = (overrides: Partial<MintosInterestAnnual> = {}): MintosInterestAnnual => ({
    id: 'uuid-1',
    mes: '2026-08',
    importeAñadido: 100,
    valorFinal: 5000,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MintosBalanceDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('toMes formatea el mes como YYYY-MM', () => {
    expect(MintosBalanceDataService.toMes(2026, 9)).toBe('2026-09');
    expect(MintosBalanceDataService.toMes(2026, 12)).toBe('2026-12');
  });

  it('getBalances y getBalance devuelven los balances del mes', () => {
    service.balances.set([augustBalance]);

    expect(service.getBalances()).toEqual([augustBalance]);
    expect(service.getBalance(2026, 8)).toEqual(augustBalance);
    expect(service.getBalance(2026, 9)).toBeUndefined();
  });

  it('loadHistory llama al GET sin filtros', () => {
    service.loadHistory(2026, 8);

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/mintos/intereses-anuales'));
    expect(req.request.params.get('mes')).toBeNull();

    req.flush([response()]);

    expect(service.balances()).toEqual([augustBalance]);
  });

  it('loadHistory no repite la llamada si ya carga desde el mismo mes', () => {
    service.loadHistory(2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/mintos/intereses-anuales')).flush([response({ mes: '2026-07' })]);

    service.loadHistory(2026, 8);

    expect(service.balances()).toEqual([jasmine.objectContaining({ mes: '2026-07' })]);
    httpMock.expectNone(r => r.method === 'GET' && r.url.endsWith('/mintos/intereses-anuales'));
  });

  it('loadHistory recarga cuando cambia el mes', () => {
    service.loadHistory(2026, 8);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/mintos/intereses-anuales')).flush([response()]);

    service.loadHistory(2026, 9);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/mintos/intereses-anuales'))
      .flush([response({ id: 'uuid-2', mes: '2026-09', valorFinal: 5200 })]);

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: 'uuid-2', valorFinal: 5200 })]);
  });

  it('save hace POST (create) cuando no existe balance para el mes', () => {
    const data = { importeAnadido: 100, valorFinal: 5000 };

    let result: MintosBalance | undefined;
    service.save(2026, 8, data).subscribe(b => (result = b));

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/mintos/intereses-anuales'));
    expect(req.request.body).toEqual({ mes: '2026-08', importeAñadido: 100, valorFinal: 5000 });
    req.flush(response());

    expect(result).toEqual(augustBalance);
    expect(service.balances()).toEqual([augustBalance]);
  });

  it('save hace PUT con el id cuando ya existe balance para el mes', () => {
    service.balances.set([augustBalance]);
    const data = { importeAnadido: 100, valorFinal: 5200 };

    service.save(2026, 8, data).subscribe();

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url.endsWith('/mintos/intereses-anuales/uuid-1'));
    expect(req.request.body).toEqual({ mes: '2026-08', importeAñadido: 100, valorFinal: 5200 });
    req.flush({ ...response(), valorFinal: 5200 });

    expect(service.balances()).toEqual([jasmine.objectContaining({ id: 'uuid-1', valorFinal: 5200 })]);
  });

  it('delete llama al DELETE con el id y elimina el balance local', () => {
    service.balances.set([augustBalance]);

    service.delete('uuid-1').subscribe();

    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/mintos/intereses-anuales/uuid-1'));
    req.flush({});

    expect(service.balances()).toEqual([]);
  });
});