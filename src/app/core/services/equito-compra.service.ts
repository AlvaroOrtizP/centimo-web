import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { EquitoCompraService } from '../../api/generated/api/equitoCompra.service';
import { EquitoCompraCreate } from '../../api/generated/model/equitoCompraCreate';
import { EquitoCompraUpdate } from '../../api/generated/model/equitoCompraUpdate';
import { EquitoCompraResponse } from '../../api/generated/model/equitoCompraResponse';
import { EquitoCompra, EquitoCompraEstado, EquitoCompraSave } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class EquitoCompraDataService {
  private readonly equitoApi = inject(EquitoCompraService);
  private readonly logger = inject(LoggerService);

  readonly compras = signal<EquitoCompra[]>([]);
  private loaded = false;

  getCompras(): EquitoCompra[] {
    return this.compras();
  }

  getCompra(id: string): EquitoCompra | undefined {
    return this.compras().find(c => c.id === id);
  }

  loadCompras(force = false): void {
    if (!force && this.loaded) { return; }
    this.loaded = true;

    this.equitoApi.listEquitoCompras().pipe(
      map(list => list.map(r => this.mapFromApi(r)).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))),
      catchError((err) => {
        this.logger.error('EquitoCompraData', 'loadCompras error', err);
        return of([]);
      }),
    ).subscribe(items => {
      this.compras.set(items);
    });
  }

  save(data: EquitoCompraSave): Observable<EquitoCompra> {
    const request: EquitoCompraCreate = {
      fecha: data.fecha,
      entidad: data.entidad,
      monto: data.monto,
      rendimiento: data.rendimiento,
      estado: data.estado,
    };

    return this.equitoApi.createEquitoCompra(request).pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('EquitoCompraData', 'save error', err);
        throw err;
      }),
    );
  }

  update(id: string, data: EquitoCompraSave): Observable<EquitoCompra> {
    const request: EquitoCompraUpdate = {
      fecha: data.fecha,
      entidad: data.entidad,
      monto: data.monto,
      rendimiento: data.rendimiento,
      estado: data.estado,
    };

    return this.equitoApi.updateEquitoCompra(id, request).pipe(
      map(r => this.mapFromApi(r)),
      tap(item => this.upsertLocal(item)),
      catchError((err) => {
        this.logger.error('EquitoCompraData', `update(${id}) error`, err);
        throw err;
      }),
    );
  }

  setEstado(id: string, estado: EquitoCompraEstado): Observable<EquitoCompra> {
    const existing = this.getCompra(id);
    if (!existing) {
      throw new Error(`equito compra ${id} not found`);
    }
    return this.update(id, { ...existing, estado });
  }

  delete(id: string): Observable<any> {
    return this.equitoApi.deleteEquitoCompra(id).pipe(
      map(() => {
        this.compras.update(current => current.filter(c => c.id !== id));
      }),
      catchError((err) => {
        this.logger.error('EquitoCompraData', `delete(${id}) error`, err);
        throw err;
      }),
    );
  }

  private mapFromApi(r: EquitoCompraResponse): EquitoCompra {
    return {
      id: r.id,
      fecha: r.fecha,
      entidad: r.entidad,
      monto: r.monto,
      rendimiento: r.rendimiento,
      estado: r.estado as EquitoCompraEstado,
    };
  }

  private upsertLocal(item: EquitoCompra): void {
    this.compras.update(current => {
      const withoutPrevious = current.filter(c => c.id !== item.id);
      return [...withoutPrevious, item].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    });
  }
}