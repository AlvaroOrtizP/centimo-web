import { Routes } from '@angular/router';

import { initDataResolver } from './core/resolvers/init-data.resolver';

export const routes: Routes = [
  { path: '', resolve: { _: initDataResolver }, loadComponent: () => import('./features/dashboard').then(m => m.DashboardComponent) },
  { path: 'income', loadComponent: () => import('./features/income').then(m => m.IncomeComponent) },
  { path: 'month/:year/:month', loadComponent: () => import('./features/monthly-view').then(m => m.MonthlyViewComponent) },
  { path: 'platform/:id', loadComponent: () => import('./features/platform-detail').then(m => m.PlatformDetailComponent) },
  { path: 'trends', loadComponent: () => import('./features/trends').then(m => m.TrendsComponent) },
  { path: 'trades', loadComponent: () => import('./features/trade-log').then(m => m.TradeLogComponent) },
  { path: 'entry/:platformId', loadComponent: () => import('./features/entry-form').then(m => m.EntryFormComponent) },
  { path: '**', redirectTo: '' },
];
