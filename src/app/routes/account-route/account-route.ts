import { Component, inject } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';

@Component({
  selector: 'app-account-route',
  imports: [],
  templateUrl: './account-route.html',
  styleUrl: './account-route.css',
})
export class AccountRoute {
  identityService = inject(IdentityService);
}
