import { Injectable, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { NominaService } from '../../api/generated/api/nomina.service';
import { NominaRequest } from '../../api/generated/model/nominaRequest';
import { NominaResponse } from '../../api/generated/model/nominaResponse';
import { Nomina } from '../../models';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class NominaDataService {
  private readonly nominaApi = inject(NominaService);
  private readonly logger = inject(LoggerService);

  private readonly nominasByMes = signal<Map<string, Nomina | null>>(new Map());

  getNomina(year: number, month: number): Nomina | undefined {
    return this.nominasByMes().get(NominaDataService.toMes(year, month)) ?? undefined;
  }

  loadNomina(year: number, month: number, force = false): Observable<Nomina | null> {
    const mes = NominaDataService.toMes(year, month);
    const cached = this.nominasByMes().get(mes);
    if (!force && this.nominasByMes().has(mes)) {
      return of(cached ?? null);
    }

    return this.nominaApi.getNomina(mes).pipe(
      map(r => this.mapFromApi(r)),
      tap(nomina => this.setMes(mes, nomina)),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.setMes(mes, null);
          return of(null);
        }
        this.logger.error('NominaData', `loadNomina(${mes}) error`, err);
        return of(cached ?? null);
      }),
    );
  }

  saveNomina(year: number, month: number, cantidad: number, nota?: string): Observable<Nomina> {
    const mes = NominaDataService.toMes(year, month);
    const request: NominaRequest = {
      mes,
      cantidad,
      nota: nota?.trim() ? nota.trim() : undefined,
    };

    const call$ = this.getNomina(year, month)
      ? this.nominaApi.updateNomina(mes, request)
      : this.nominaApi.createNomina(request);

    return call$.pipe(
      map(r => this.mapFromApi(r)),
      tap(nomina => this.setMes(mes, nomina)),
      catchError(err => {
        this.logger.error('NominaData', `saveNomina(${mes}) error`, err);
        throw err;
      }),
    );
  }

  deleteNomina(year: number, month: number): Observable<void> {
    const mes = NominaDataService.toMes(year, month);
    return this.nominaApi.deleteNomina(mes).pipe(
      map(() => this.setMes(mes, null)),
      catchError(err => {
        this.logger.error('NominaData', `deleteNomina(${mes}) error`, err);
        throw err;
      }),
    );
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private mapFromApi(r: NominaResponse): Nomina {
    return { mes: r.mes, cantidad: r.cantidad, nota: r.nota };
  }

  private setMes(mes: string, nomina: Nomina | null): void {
    this.nominasByMes.update(map => new Map(map.set(mes, nomina)));
  }
}
