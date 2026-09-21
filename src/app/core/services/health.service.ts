import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  // private readonly http = inject(HttpClient); // TODO(BACKEND): llamada real comentada (mock)
  private readonly healthUrl = `${environment.apiUrl}/api/v1/health`;

  private static readonly HEALTH_KEY = 'centimo:health-ok';
  private static readonly HEALTH_TTL_MS = 30 * 60 * 1000;

  check(): Observable<unknown> {
    // TODO(BACKEND): llamada a GET /health comentada. Mock: backend considerado sano.
    return of({ status: 'UP' });
  }

  pollUntilHealthy(intervalMs = 2500, maxAttempts = 30): Observable<number> {
    return timer(0, intervalMs).pipe(take(maxAttempts));
  }

  /** Devuelve true si el backend respondió sano hace menos de 30 min. */
  isRecentlyHealthy(): boolean {
    // TODO(BACKEND): mock: se entra directamente sin comprobar el backend real.
    return true;
    // try {
    //   const raw = localStorage.getItem(HealthService.HEALTH_KEY);
    //   return !!raw && Date.now() - Number(raw) < HealthService.HEALTH_TTL_MS;
    // } catch {
    //   return false;
    // }
  }

  markHealthy(): void {
    // TODO(BACKEND): mock: no-op mientras no haya backend real.
    // try {
    //   localStorage.setItem(HealthService.HEALTH_KEY, String(Date.now()));
    // } catch {
    //   // ignore
    // }
  }
}
