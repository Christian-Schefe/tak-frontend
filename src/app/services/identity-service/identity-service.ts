import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth-service/auth-service';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import z from 'zod';
import { map } from 'rxjs';

export const accountInfo = z.object({
  accountId: z.string(),
  playerId: z.string(),
  isGuest: z.boolean(),
  jwt: z.string(),
});

interface GuestInfo {
  jwt: string;
}

const accountInfoResponse = z.union([accountInfo, z.null()]);

type AccountInfoResponse = z.infer<typeof accountInfoResponse>;

const GUEST_JWT_STORAGE_KEY = 'guestJwt';

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  httpClient = inject(HttpClient);
  authService = inject(AuthService);

  account = smartHttpResource<AccountInfoResponse>(accountInfoResponse, () => {
    const authState = this.authService.authState();
    console.log('Fetching account info', authState.type);
    return authState.type !== 'loading' ? '/api2/whoami' : undefined;
  });
  identity = computed(() => this.account.value() ?? null);

  proceedAsGuest() {
    return this.httpClient.get<GuestInfo>('/api2/guest').pipe(
      map((res) => {
        console.log('Guest account retrieved', res);
        this.guestJwt.set(res.jwt);
        this.authService.isGuest.set(true);
        return res;
      }),
    );
  }

  async logout() {
    this.guestJwt.set(null);
    await this.authService.logout();
  }

  apiToken = computed(() => {
    const identity = this.identity();
    if (identity !== null) {
      return identity.jwt;
    }
    return this.guestJwt();
  });

  guestJwt = signal<string | null>(localStorage.getItem(GUEST_JWT_STORAGE_KEY) ?? null);

  private readonly _syncGuestJwtEffect = effect(() => {
    const token = this.guestJwt();
    console.log('Syncing guest JWT:', token);
    if (token !== null && token.length > 0) {
      localStorage.setItem(GUEST_JWT_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(GUEST_JWT_STORAGE_KEY);
    }
  });
}
