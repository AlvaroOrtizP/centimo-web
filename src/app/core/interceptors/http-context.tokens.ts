import { HttpContextToken } from '@angular/common/http';

/**
 * Marca una petición como sonda de arranque (hoy, el GET /health).
 *
 * Las sondas se saltan el `backendReadyInterceptor` (se usan precisamente para
 * averiguar si el back está listo) y sus fallos no generan notificación de
 * error: mientras el back arranca, que /health falle es lo normal.
 */
export const BACKEND_PROBE = new HttpContextToken<boolean>(() => false);
