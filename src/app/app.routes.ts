import { Routes } from '@angular/router';
import { AppLayout } from './layout/app-layout/app-layout';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./routes/home-route/home-route').then((m) => m.HomeRoute),
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
      {
        path: 'games',
        loadComponent: () => import('./routes/games-route/games-route').then((m) => m.GamesRoute),
      },
      {
        path: 'seeks',
        loadComponent: () => import('./routes/seeks-route/seeks-route').then((m) => m.SeeksRoute),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./routes/new-game-route/new-game-route').then((m) => m.NewGameRoute),
      },
      {
        path: '**',
        loadComponent: () =>
          import('./routes/not-found-route/not-found-route').then((m) => m.NotFoundRoute),
      },
    ],
  },
];
