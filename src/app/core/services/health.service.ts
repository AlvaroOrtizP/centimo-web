import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly healthUrl = `${environment.apiUrl}/api/v1/health`;

  private static readonly HEALTH_KEY = 'centimo:health-ok';
  private static readonly HEALTH_TTL_MS = 30 * 60 * 1000;

  check(): Observable<unknown> {
    return this.http.get(this.healthUrl);
  }

  pollUntilHealthy(intervalMs = 2500, maxAttempts = 30): Observable<number> {
    return timer(0, intervalMs).pipe(take(maxAttempts));
  }

  /** Devuelve true si el backend respondió sano hace menos de 30 min. */
  isRecentlyHealthy(): boolean {
    try {
      const raw = localStorage.getItem(HealthService.HEALTH_KEY);
      return !!raw && Date.now() - Number(raw) < HealthService.HEALTH_TTL_MS;
    } catch {
      return false;
    }
  }

  markHealthy(): void {
    try {
      localStorage.setItem(HealthService.HEALTH_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }
}
