import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { UrbanitaeCompraDataService } from './urbanitae-compra.service';
import { UrbanitaeCompra } from '../../models';
import { UrbanitaeCompraResponse } from '../../api/generated/model/urbanitaeCompraResponse';

describe('UrbanitaeCompraDataService', () => {
  let service: UrbanitaeCompraDataService;
  let httpMock: HttpTestingController;

  const compra: UrbanitaeCompra = {
    id: 'uuid-1',
    fecha: '2026-08-10',
    entidad: 'Vivienda Madrid',
    monto: 1000,
    rendimiento: 8.5,
    estado: 'activa',
  };

  const response = (overrides: Partial<UrbanitaeCompraResponse> = {}): UrbanitaeCompraResponse => ({
    id: 'uuid-1',
    fecha: '2026-08-10',
    entidad: 'Vivienda Madrid',
    monto: 1000,
    rendimiento: 8.5,
    estado: 'activa',
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UrbanitaeCompraDataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getCompras y getCompra devuelven las compras', () => {
    service.compras.set([compra]);

    expect(service.getCompras()).toEqual([compra]);
    expect(service.getCompra('uuid-1')).toEqual(compra);
    expect(service.getCompra('other')).toBeUndefined();
  });

  it('loadCompras llama al GET y ordena por fecha descendente', () => {
    service.loadCompras();

    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/compras'));
    req.flush([response(), response({ id: 'uuid-2', fecha: '2026-09-01' })]);

    expect(service.compras().map(c => c.id)).toEqual(['uuid-2', 'uuid-1']);
  });

  it('loadCompras no repite la llamada salvo con force', () => {
    service.loadCompras();
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/compras')).flush([response()]);
    expect(service.getCompras().length).toBe(1);

    service.loadCompras();
    httpMock.expectNone(r => r.method === 'GET' && r.url.endsWith('/urbanitae/compras'));

    service.loadCompras(true);
    httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/urbanitae/compras')).flush([response()]);
    expect(service.getCompras().length).toBe(1);
  });

  it('save hace POST creando la compra', () => {
    const data = { fecha: '2026-08-10', entidad: 'Vivienda Madrid', monto: 1000, rendimiento: 8.5, estado: 'activa' as const };

    let result: UrbanitaeCompra | undefined;
    service.save(data).subscribe(c => (result = c));

    const req = httpMock.expectOne(r => r.method === 'POST' && r.url.endsWith('/urbanitae/compras'));
    expect(req.request.body).toEqual(data);
    req.flush(response());

    expect(result).toEqual(compra);
    expect(service.compras()).toEqual([compra]);
  });

  it('update hace PUT con el id', () => {
    service.compras.set([compra]);
    const data = { ...compra, monto: 1200 };

    service.update('uuid-1', data).subscribe();

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url.endsWith('/urbanitae/compras/uuid-1'));
    expect(req.request.body).toEqual({ fecha: '2026-08-10', entidad: 'Vivienda Madrid', monto: 1200, rendimiento: 8.5, estado: 'activa' });
    req.flush(response({ monto: 1200 }));

    expect(service.compras()).toEqual([jasmine.objectContaining({ id: 'uuid-1', monto: 1200 })]);
  });

  it('setEstado cambia el estado de una compra', () => {
    service.compras.set([compra]);

    service.setEstado('uuid-1', 'vendida').subscribe();

    const req = httpMock.expectOne(r => r.method === 'PUT' && r.url.endsWith('/urbanitae/compras/uuid-1'));
    expect(req.request.body).toEqual({ fecha: '2026-08-10', entidad: 'Vivienda Madrid', monto: 1000, rendimiento: 8.5, estado: 'vendida' });
    req.flush(response({ estado: 'vendida' }));

    expect(service.compras()).toEqual([jasmine.objectContaining({ id: 'uuid-1', estado: 'vendida' })]);
  });

  it('delete llama al DELETE con el id y elimina la compra local', () => {
    service.compras.set([compra]);

    service.delete('uuid-1').subscribe();

    const req = httpMock.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/urbanitae/compras/uuid-1'));
    req.flush({});

    expect(service.compras()).toEqual([]);
  });
});