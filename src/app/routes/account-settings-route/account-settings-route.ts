import { Component, inject } from '@angular/core';
import { KratosFlowComponent } from '../../components/kratos-flow-component/kratos-flow-component';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth-service';

@Component({
  selector: 'app-account-settings-route',
  imports: [KratosFlowComponent, CardModule, ButtonModule],
  templateUrl: './account-settings-route.html',
  styleUrl: './account-settings-route.css',
})
export class AccountSettingsRoute {
  authService = inject(AuthService);
  router = inject(Router);

  onLogout() {
    void this.doLogout();
  }

  async doLogout() {
    await this.authService.logout();
    await this.router.navigate(['/']);
  }
}
