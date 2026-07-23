import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'income', loadComponent: () => import('./features/income/income.component').then(m => m.IncomeComponent) },
  { path: 'month/:year/:month', loadComponent: () => import('./features/monthly-view/monthly-view.component').then(m => m.MonthlyViewComponent) },
  { path: 'platform/:id', loadComponent: () => import('./features/platform-detail/platform-detail.component').then(m => m.PlatformDetailComponent) },
  { path: 'trends', loadComponent: () => import('./features/trends/trends.component').then(m => m.TrendsComponent) },
  { path: 'trades', loadComponent: () => import('./features/trade-log/trade-log.component').then(m => m.TradeLogComponent) },
  { path: 'entry/:platformId', loadComponent: () => import('./features/entry-form/entry-form.component').then(m => m.EntryFormComponent) },
  { path: '**', redirectTo: '' },
];
