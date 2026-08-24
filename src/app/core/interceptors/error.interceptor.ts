import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { LoggerService } from '../services/logger.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const logger = inject(LoggerService);
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(error => {
      const message = getErrorMessage(error);
      logger.error('HTTP', `${req.method} ${req.url}`, error);

      if (error && typeof error === 'object' && (error.status === 401 || error.status === 403)) {
        auth.logout();
        router.navigate(['/login']);
      }

      notification.showError(message);
      return throwError(() => error);
    }),
  );
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Error desconocido';
  }

  const err = error as { status?: number; message?: string; error?: { message?: string } };

  if (err.status === 0) {
    return 'No se puede conectar al servidor';
  }

  if (err.status === 404) {
    return 'Recurso no encontrado';
  }

  if (err.status === 401 || err.status === 403) {
    return 'No autorizado';
  }

  if (err.status && err.status >= 500) {
    return 'Error del servidor';
  }

  return err.error?.message ?? err.message ?? 'Error inesperado';
}
