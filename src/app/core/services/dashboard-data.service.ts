import { Injectable, inject, signal } from '@angular/core';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DashboardService } from '../../api/generated/api/dashboard.service';
import { DashboardCategoria } from '../../api/generated/model/dashboardCategoria';
import { DashboardCategoriaBalance } from '../../api/generated/model/dashboardCategoriaBalance';
import { DashboardResponse } from '../../api/generated/model/dashboardResponse';
import { DashboardSerieBalance } from '../../api/generated/model/dashboardSerieBalance';
import { DASHBOARD_DEFAULT_MESES_ATRAS } from '../constants/dashboard.constants';
import { LoggerService } from './logger.service';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private readonly dashboardApi = inject(DashboardService);
  private readonly logger = inject(LoggerService);

  private readonly balances = signal<Map<string, DashboardResponse>>(new Map());
  private readonly series = signal<Map<string, DashboardSerieBalance[]>>(new Map());
  private readonly serieCategorias = signal<Map<string, DashboardCategoriaBalance[]>>(new Map());
  private readonly pending = new Set<string>();

  getBalance(mes: string): DashboardResponse | undefined {
    return this.balances().get(mes);
  }

  loadBalance(mes: string, force = false): void {
    const key = `balance:${mes}`;
    if (this.pending.has(key) || this.balances().has(mes)) {
      if (!force) { return; }
    }
    this.pending.add(key);

    this.dashboardApi.getDashboardBalance(mes).pipe(
      catchError((err) => {
        this.logger.error('DashboardData', `loadBalance(${mes}) error`, err);
        return of(undefined);
      }),
    ).subscribe(result => {
      this.pending.delete(key);
      if (result) {
        this.balances.update(map => new Map(map).set(mes, result));
      }
    });
  }

  getSerie(entidad: string | undefined, mes: string, mesesAtras = DASHBOARD_DEFAULT_MESES_ATRAS): DashboardSerieBalance[] | undefined {
    return this.series().get(this.serieKey(entidad, mes, mesesAtras));
  }

  loadSerie(entidad: string | undefined, mes: string, mesesAtras = DASHBOARD_DEFAULT_MESES_ATRAS, force = false): void {
    const key = this.serieKey(entidad, mes, mesesAtras);
    if (this.pending.has(key) || this.series().has(key)) {
      if (!force) { return; }
    }
    this.pending.add(key);

    this.dashboardApi.listDashboardBalanceSerie(mes, entidad, mesesAtras).pipe(
      catchError((err) => {
        this.logger.error('DashboardData', `loadSerie(${key}) error`, err);
        return of([]);
      }),
    ).subscribe(rows => {
      this.pending.delete(key);
      this.series.update(map => new Map(map).set(key, rows));
    });
  }

  getSerieCategoria(categoria: DashboardCategoria, mes: string, mesesAtras = DASHBOARD_DEFAULT_MESES_ATRAS): DashboardCategoriaBalance[] | undefined {
    return this.serieCategorias().get(this.categoriaKey(categoria, mes, mesesAtras));
  }

  loadSerieCategoria(categoria: DashboardCategoria, mes: string, mesesAtras = DASHBOARD_DEFAULT_MESES_ATRAS, force = false): void {
    const key = this.categoriaKey(categoria, mes, mesesAtras);
    if (this.pending.has(key) || this.serieCategorias().has(key)) {
      if (!force) { return; }
    }
    this.pending.add(key);

    this.dashboardApi.listDashboardCategoriaSerie(categoria, mes, mesesAtras).pipe(
      catchError((err) => {
        this.logger.error('DashboardData', `loadSerieCategoria(${key}) error`, err);
        return of([]);
      }),
    ).subscribe(rows => {
      this.pending.delete(key);
      this.serieCategorias.update(map => new Map(map).set(key, rows));
    });
  }

  clearCache(): void {
    this.pending.clear();
    this.balances.set(new Map());
    this.series.set(new Map());
    this.serieCategorias.set(new Map());
  }

  static toMes(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  private serieKey(entidad: string | undefined, mes: string, mesesAtras: number): string {
    return `serie:${entidad ?? ''}|${mes}|${mesesAtras}`;
  }

  private categoriaKey(categoria: DashboardCategoria, mes: string, mesesAtras: number): string {
    return `cat:${categoria}|${mes}|${mesesAtras}`;
  }
}