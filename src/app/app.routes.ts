import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/integration', pathMatch: 'full' },
  {
    path: 'integration',
    loadChildren: () =>
      import('./features/integration/integration.module').then(
        (m) => m.IntegrationModule
      ),
  },
  {
    path: 'data',
    loadChildren: () =>
      import('./features/data-view/data-view.module').then(
        (m) => m.DataViewModule
      ),
  },
  {
    path: 'auth/github/callback',
    loadComponent: () =>
      import('./features/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent
      ),
  },
  { path: '**', redirectTo: '/integration' },
];
