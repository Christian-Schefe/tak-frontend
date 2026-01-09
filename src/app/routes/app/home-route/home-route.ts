import { Component, inject } from '@angular/core';
import { IdentityService } from '../../../tak/identity-service';

@Component({
  selector: 'app-home-route',
  imports: [],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
export class HomeRoute {
  identityService = inject(IdentityService);
}
