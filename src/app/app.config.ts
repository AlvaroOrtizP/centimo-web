import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import './core/chart-init';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
