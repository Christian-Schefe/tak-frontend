import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GuestService } from '../../services/guest-service/guest-service';
import { AuthService } from '../../services/auth-service/auth-service';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-main-route',
  imports: [RouterLink, ButtonModule, RippleModule],
  templateUrl: './main-route.html',
  styleUrl: './main-route.css',
})
export class MainRoute {
  authService = inject(AuthService);
  guestService = inject(GuestService);
  router = inject(Router);

  onLogout() {
    this.authService.logout();
  }

  onContinueAsGuest() {
    this.guestService.getGuestAccount().subscribe(() => {
      this.router.navigate(['/app']);
    });
  }
}
