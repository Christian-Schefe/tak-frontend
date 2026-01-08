import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth-service/auth-service';

@Component({
  selector: 'app-logout-component',
  imports: [],
  templateUrl: './logout-component.html',
  styleUrl: './logout-component.css',
})
export class LogoutComponent {
  authService = inject(AuthService);
  router = inject(Router);

  constructor() {
    effect(() => this.maybeLogout());
  }

  async maybeLogout() {
    const authStatus = this.authService.isLoggedIn();
    if (authStatus !== null) {
      if (authStatus) {
        await this.authService.logout();
      }
      this.router.navigate(['/']);
    }
  }
}
