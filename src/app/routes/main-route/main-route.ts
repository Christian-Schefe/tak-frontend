import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth-service';

@Component({
  selector: 'app-main-route',
  imports: [RouterLink],
  templateUrl: './main-route.html',
  styleUrl: './main-route.css',
})
export class MainRoute {
  authService = inject(AuthService);

  onLogout() {
    this.authService.logout();
  }
}
