import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError(error => {
      const message = getErrorMessage(error);
      console.error(`[HTTP Error] ${req.method} ${req.url}:`, error);
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
