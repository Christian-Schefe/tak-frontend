import { Routes } from '@angular/router';
import { MainRoute } from './routes/main-route/main-route';
import { VerificationRoute } from './auth/verification-route/verification-route';
import { AuthRoute } from './auth/auth-route/auth-route';
import { authGuard } from './routes/app/auth-guard';
import { HomeRoute } from './routes/app/home-route/home-route';

export const routes: Routes = [
  {
    path: '',
    component: MainRoute,
  },
  { path: 'verify', component: VerificationRoute },
  { path: 'authenticate', component: AuthRoute },
  {
    path: 'app',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    component: HomeRoute,
    children: [],
  },
];
