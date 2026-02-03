import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth-service/auth-service';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { IdentityService } from '../../services/identity-service/identity-service';

@Component({
  selector: 'app-main-route',
  imports: [RouterLink, ButtonModule, RippleModule],
  templateUrl: './main-route.html',
  styleUrl: './main-route.css',
})
export class MainRoute {
  authService = inject(AuthService);
  identityService = inject(IdentityService);
  router = inject(Router);

  onLogout() {
    void this.authService.logout();
  }

  onContinueAsGuest() {
    this.identityService.proceedAsGuest().subscribe(() => {
      void this.router.navigate(['/app']);
    });
  }
}
