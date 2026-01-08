import { Component, signal } from '@angular/core';
import { RegistrationComponent } from '../registration-component/registration-component';
import { LoginComponent } from '../login-component/login-component';

@Component({
  selector: 'app-auth-route',
  imports: [RegistrationComponent, LoginComponent],
  templateUrl: './auth-route.html',
  styleUrl: './auth-route.css',
})
export class AuthRoute {
  showRegistration = signal(false);

  toggleShowRegistration() {
    this.showRegistration.update((value) => !value);
  }
}
