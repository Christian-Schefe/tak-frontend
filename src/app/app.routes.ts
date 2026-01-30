import { Routes } from '@angular/router';
import { MainRoute } from './routes/main-route/main-route';
import { VerificationRoute } from './routes/verification-route/verification-route';
import { AuthRoute } from './routes/auth-route/auth-route';
import { authGuard } from './auth/auth-guard/auth-guard';
import { HomeRoute } from './routes/home-route/home-route';
import { PublicLayout } from './layout/public-layout/public-layout';
import { AppLayout } from './layout/app-layout/app-layout';
import { LocalPlayRoute } from './routes/local-play-route/local-play-route';
import { SettingsRoute } from './routes/settings-route/settings-route';
import { OnlinePlayRoute } from './routes/online-play-route/online-play-route';
import { PlayerProfileRoute } from './routes/player-profile-route/player-profile-route';
import { ReloginRoute } from './routes/relogin-route/relogin-route';
import { RecoveryRoute } from './routes/recovery-route/recovery-route';
import { AccountSettingsRoute } from './routes/account-settings-route/account-settings-route';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: MainRoute },
      { path: 'verify', component: VerificationRoute },
      { path: 'recover', component: RecoveryRoute },
      { path: 'relogin', component: ReloginRoute },
      { path: 'authenticate', component: AuthRoute },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    component: AppLayout,
    children: [
      { path: '', component: HomeRoute },
      { path: 'account', component: AccountSettingsRoute },
      { path: 'local', component: LocalPlayRoute },
      { path: 'online/:id', component: OnlinePlayRoute },
      { path: 'settings', component: SettingsRoute },
      { path: 'player/:id', component: PlayerProfileRoute },
    ],
  },
];
