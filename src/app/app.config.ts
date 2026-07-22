import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import './core/chart-init';
import { routes } from './app.routes';
import { provideApi } from './api/generated/provide-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideApi('http://localhost:8080/api/v1'),
  ]
};
