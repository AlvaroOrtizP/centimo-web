import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { UrbanitaeCompraService } from '../../api/generated/api/urbanitaeCompra.service';
import { UrbanitaeCompraCreate } from '../../api/generated/model/urbanitaeCompraCreate';
import { UrbanitaeCompraUpdate } from '../../api/generated/model/urbanitaeCompraUpdate';
import { UrbanitaeCompraResponse } from '../../api/generated/model/urbanitaeCompraResponse';
import { UrbanitaeCompra, UrbanitaeCompraEstado, UrbanitaeCompraSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class UrbanitaeCompraDataService {
  private readonly urbanitaeApi = inject(UrbanitaeCompraService);
  private readonly logger = inject(LoggerService);

  readonly compras = signal<UrbanitaeCompra[]>([]);
  private loaded = false;

  getCompras(): UrbanitaeCompra[] {
    return this.compras();
  }

  getCompra(id: string): UrbanitaeCompra | undefined {
    return this.compras().find(c => c.id === id);
  }

  loadCompras(force = false): void {
    if (!force && this.loaded) { return; }
    this.loaded = true;

    this.urbanitaeApi.listUrbanitaeCompras().pipe(
      map(list => list.map(r => this.mapFromApi(r)).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))),
      catchError((err) => {
        this.logger.error('UrbanitaeCompraData', 'loadCompras error', err);
        return of([]);
      }),
    ).subscribe(items => {
      this.compras.set(items);
    });
  }

  save(data: UrbanitaeCompraSave): Observable<UrbanitaeCompra> {
    const request: UrbanitaeCompraCreate = {
      fecha: data.fecha,
      entidad: data.entidad,
      monto: data.monto,
      rendimiento: data.rendimiento,
      estado: data.estado,
    };

    return this.urbanitaeApi.createUrbanitaeCompra(request).pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('UrbanitaeCompraData', 'save error', err);
        throw err;
      }),
    );
  }

  update(id: string, data: UrbanitaeCompraSave): Observable<UrbanitaeCompra> {
    const request: UrbanitaeCompraUpdate = {
      fecha: data.fecha,
      entidad: data.entidad,
      monto: data.monto,
      rendimiento: data.rendimiento,
      estado: data.estado,
    };

    return this.urbanitaeApi.updateUrbanitaeCompra(id, request).pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('UrbanitaeCompraData', `update(${id}) error`, err);
        throw err;
      }),
    );
  }

  setEstado(id: string, estado: UrbanitaeCompraEstado): Observable<UrbanitaeCompra> {
    const existing = this.getCompra(id);
    if (!existing) {
      throw new Error(`urbanitae compra ${id} not found`);
    }
    return this.update(id, { ...existing, estado });
  }

  delete(id: string): Observable<any> {
    return this.urbanitaeApi.deleteUrbanitaeCompra(id).pipe(
      map(() => {
        this.compras.update(current => current.filter(c => c.id !== id));
      }),
      catchError((err) => {
        this.logger.error('UrbanitaeCompraData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: UrbanitaeCompraResponse): UrbanitaeCompra {
    return {
      id: r.id,
      fecha: r.fecha,
      entidad: r.entidad,
      monto: r.monto,
      rendimiento: r.rendimiento,
      estado: r.estado as UrbanitaeCompraEstado,
    };
  }

  private upsertLocal(item: UrbanitaeCompra): void {
    this.compras.update(current => {
      const withoutPrevious = current.filter(c => c.id !== item.id);
      return [...withoutPrevious, item].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    });
  }
}