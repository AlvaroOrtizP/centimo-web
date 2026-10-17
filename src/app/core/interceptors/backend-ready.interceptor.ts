import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';

import { HealthService } from '../services/health.service';
import { BACKEND_PROBE } from './http-context.tokens';

/**
 * Retiene las peticiones hasta que el back haya dado señales de vida.
 *
 * En Render (plan free) el back se duerme y tarda ~30-60 s en arrancar. Sin
 * este gate, la primera tanda de peticiones (la del `initDataResolver`) falla
 * y la app se queda con el dashboard vacío, sin forma de recuperarlo. Con el
 * gate esas peticiones quedan en cola y salen solas en cuanto el back está
 * listo, incluido el caso de pulsar "Reintentar" tras el error de arranque.
 */
export const backendReadyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(BACKEND_PROBE)) {
    return next(req);
  }

  const health = inject(HealthService);
  return health.waitUntilReady().pipe(switchMap(() => next(req)));
};
