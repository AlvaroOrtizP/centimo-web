import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
// import { provideHttpClient } from '@angular/common/http';

import './core/chart-init';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)] // TODO: añadir provideHttpClient() cuando se activen las llamadas al backend
};
