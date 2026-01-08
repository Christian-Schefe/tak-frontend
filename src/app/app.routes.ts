import { Routes } from '@angular/router';
import { MainRoute } from './routes/main-route/main-route';
import { LogoutComponent } from './auth/logout-component/logout-component';

export const routes: Routes = [
  {
    path: '',
    component: MainRoute,
  },
  { path: 'logout', component: LogoutComponent },
];
