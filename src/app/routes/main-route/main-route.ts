import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth-service/auth-service';
import { AuthRoute } from "../../auth/auth-route/auth-route";

@Component({
  selector: 'app-main-route',
  imports: [RouterLink, AuthRoute],
  templateUrl: './main-route.html',
  styleUrl: './main-route.css',
})
export class MainRoute {
  authService = inject(AuthService);
}
