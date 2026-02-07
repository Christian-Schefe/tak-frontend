import { computed, effect, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth-service/auth-service';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import z from 'zod';
import { Router } from '@angular/router';

export const accountInfo = z.object({
  accountId: z.string(),
  playerId: z.string(),
  isGuest: z.boolean(),
  newGuest: z.boolean(),
  jwt: z.string(),
});

type AccountInfo = z.infer<typeof accountInfo>;

const JWT_STORAGE_KEY = 'api_jwt';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  httpClient = inject(HttpClient);
  authService = inject(AuthService);
  router = inject(Router);

  private account = smartHttpResource<AccountInfo>(accountInfo, () => {
    const authState = this.authService.authState();
    console.log('Fetching account info', authState.type);
    return authState.type !== 'loading' ? '/api2/whoami' : undefined;
  });
  identity = computed(() => this.account.value() ?? null);

  _navigateToLoginEffect = effect(() => {
    const identity = this.identity();
    if (identity !== null && identity.newGuest) {
      console.log('New guest login detected, navigating to login page');
      void this.router.navigate(['/authenticate']);
    }
  });

  getApiToken() {
    const identity = this.identity();
    if (identity !== null) {
      return identity.jwt;
    }
    const token = localStorage.getItem(JWT_STORAGE_KEY);
    return token !== null && token.length > 0 ? token : null;
  }

  private readonly _storeJwtEffect = effect(() => {
    const identity = this.identity();
    if (identity !== null) {
      localStorage.setItem(JWT_STORAGE_KEY, identity.jwt);
    }
  });
}
