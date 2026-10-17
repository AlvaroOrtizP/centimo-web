import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, filter, map, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { BACKEND_PROBE } from '../interceptors/http-context.tokens';

/**
 * Comprueba si el back está arrancado.
 *
 * En Render (plan free) el servicio se duerme a los 15 min de inactividad y el
 * arranque en frío tarda ~30-60 s. La app no debe pedir datos en ese hueco:
 * las peticiones fallarían y la pantalla quedaría vacía. `waitUntilReady()` es
 * la señal que retiene esas peticiones (ver `backendReadyInterceptor`).
 */
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);
  private readonly healthUrl = `${environment.apiUrl}/api/v1/health`;

  private static readonly HEALTH_KEY = 'centimo:health-ok';
  /**
   * Damos por bueno un /health reciente solo durante 10 min, por debajo de los
   * 15 min que tarda Render free en dormir el servicio: así un caché válido
   * implica que el back sigue despierto y se puede entrar sin comprobar.
   */
  private static readonly HEALTH_TTL_MS = 10 * 60 * 1000;

  /** Sondeo durante el arranque: cada 2,5 s y hasta ~30 s de presupuesto. */
  private static readonly POLL_MS = 2500;
  private static readonly BOOT_ATTEMPTS = 13;

  /** true cuando el back está listo (por caché reciente o por /health). */
  private readonly ready = new BehaviorSubject<boolean>(false);

  constructor() {
    if (this.isRecentlyHealthy()) {
      this.ready.next(true);
    }
  }

  /**
   * Una comprobación suelta. Cualquier respuesta HTTP cuenta como "el servidor
   * está vivo" excepto 5xx: mientras Render levanta el contenedor su proxy
   * responde 502/503, y eso sí es "todavía no".
   */
  check(): Observable<void> {
    return this.http
      .get(this.healthUrl, { context: new HttpContext().set(BACKEND_PROBE, true) })
      .pipe(
        map(() => void 0),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 0 || error.status >= 500) {
            return throwError(() => error);
          }
          return of(void 0);
        }),
      );
  }

  /** Emite (y completa) en cuanto el back está listo. */
  waitUntilReady(): Observable<void> {
    if (this.ready.value) {
      return of(void 0);
    }

    return this.ready.pipe(
      filter(Boolean),
      take(1),
      map(() => void 0),
    );
  }

  /**
   * Emite un tic cada `intervalMs` hasta `maxAttempts` veces. El consumidor
   * lanza la comprobación en cada tic: si nunca responde, la secuencia
   * completa sin emitir y eso significa "no arrancó".
   */
  pollUntilHealthy(
    intervalMs = HealthService.POLL_MS,
    maxAttempts = HealthService.BOOT_ATTEMPTS,
  ): Observable<number> {
    return timer(0, intervalMs).pipe(take(maxAttempts));
  }

  /** Devuelve true si el back respondió sano hace menos de 10 min. */
  isRecentlyHealthy(): boolean {
    try {
      const raw = localStorage.getItem(HealthService.HEALTH_KEY);
      return !!raw && Date.now() - Number(raw) < HealthService.HEALTH_TTL_MS;
    } catch {
      return false;
    }
  }

  /** Marca el back como listo y sella la fecha para el caché de arranque. */
  markHealthy(): void {
    try {
      localStorage.setItem(HealthService.HEALTH_KEY, String(Date.now()));
    } catch {
      // sin storage (modo privado): se comprobará en el próximo arranque
    }

    this.ready.next(true);
  }
}
