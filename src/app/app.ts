import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './nav-component/nav-component';
import { AuthService } from './auth/auth-service/auth-service';
import { IdentityService } from './tak/identity-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('tak-frontend');
  authService = inject(AuthService);
  identityService = inject(IdentityService);

  constructor() {
    effect(() => {
      const authState = this.authService.authState();
      if (authState.type !== 'loading') {
        this.identityService.load();
      }
    });
  }
}
