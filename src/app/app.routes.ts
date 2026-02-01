import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard/auth-guard';
import { PublicLayout } from './layout/public-layout/public-layout';
import { AppLayout } from './layout/app-layout/app-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./routes/main-route/main-route').then((m) => m.MainRoute),
      },
      {
        path: 'verify',
        loadComponent: () =>
          import('./routes/verification-route/verification-route').then((m) => m.VerificationRoute),
      },
      {
        path: 'recover',
        loadComponent: () =>
          import('./routes/recovery-route/recovery-route').then((m) => m.RecoveryRoute),
      },
      {
        path: 'relogin',
        loadComponent: () =>
          import('./routes/relogin-route/relogin-route').then((m) => m.ReloginRoute),
      },
      {
        path: 'authenticate',
        loadComponent: () => import('./routes/auth-route/auth-route').then((m) => m.AuthRoute),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    component: AppLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./routes/home-route/home-route').then((m) => m.HomeRoute),
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./routes/account-settings-route/account-settings-route').then(
            (m) => m.AccountSettingsRoute,
          ),
      },
      {
        path: 'local',
        loadComponent: () =>
          import('./routes/local-play-route/local-play-route').then((m) => m.LocalPlayRoute),
      },
      {
        path: 'online/:id',
        loadComponent: () =>
          import('./routes/online-play-route/online-play-route').then((m) => m.OnlinePlayRoute),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./routes/settings-route/settings-route').then((m) => m.SettingsRoute),
      },
      {
        path: 'player/:id',
        loadComponent: () =>
          import('./routes/player-profile-route/player-profile-route').then(
            (m) => m.PlayerProfileRoute,
          ),
      },
    ],
  },
];
