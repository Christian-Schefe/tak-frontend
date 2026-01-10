import { Routes } from '@angular/router';
import { MainRoute } from './routes/main-route/main-route';
import { VerificationRoute } from './routes/verification-route/verification-route';
import { AuthRoute } from './routes/auth-route/auth-route';
import { authGuard } from './auth/auth-guard/auth-guard';
import { HomeRoute } from './routes/home-route/home-route';
import { AccountRoute } from './routes/account-route/account-route';
import { PublicLayout } from './layout/public-layout/public-layout';
import { AppLayout } from './layout/app-layout/app-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: MainRoute },
      { path: 'verify', component: VerificationRoute },
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
      { path: 'account', component: AccountRoute },
    ],
  },
];
