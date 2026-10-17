import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import './core/chart-init';
import { routes } from './app.routes';
import { provideApi } from './api/generated/provide-api';
import { backendReadyInterceptor } from './core/interceptors/backend-ready.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { environment } from '../environments/environment';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // El gate va primero: hasta que el back no está listo, la petición ni
    // siquiera entra en el resto de la cadena (ni en el interceptor de errores).
    provideHttpClient(withInterceptors([backendReadyInterceptor, errorInterceptor, authInterceptor])),
    provideApi(environment.apiUrl + '/api/v1'),
    provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(),
        registrationStrategy: 'registerWhenStable:30000'
    })
]
};
