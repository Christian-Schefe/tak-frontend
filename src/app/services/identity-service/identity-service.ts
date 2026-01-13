import { computed, effect, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { HttpClient, httpResource } from '@angular/common/http';
import { GuestService } from '../guest-service/guest-service';
import { AuthService } from '../auth-service/auth-service';

type AccountInfoResponse =
  | ({
      type: 'authenticated';
    } & AccountInfo)
  | { type: 'unauthenticated' };

interface AccountInfo {
  accountId: string;
  playerId: string;
  isGuest: boolean;
  wsJwt: string;
}

type IdentityState = { type: 'loading' } | { type: 'loaded'; account: AccountInfo | null };

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  httpClient = inject(HttpClient);
  authService = inject(AuthService);
  guestService = inject(GuestService);

  authVersion = signal(0);

  identityState = computed<IdentityState>(() => {
    if (this.account.hasValue()) {
      const response = this.account.value();
      return { type: 'loaded', account: response.type === 'authenticated' ? response : null };
    } else {
      return { type: 'loading' };
    }
  });

  identity = linkedSignal<IdentityState, AccountInfo | null>({
    source: () => this.identityState(),
    computation: (source, prev) => {
      if (source.type === 'loaded') {
        return source.account;
      } else {
        return prev?.value ?? null;
      }
    },
  });

  account = httpResource<AccountInfoResponse>(() => {
    this.authVersion();
    console.log('Fetching account info, auth version:', this.authVersion());
    return '/api2/whoami';
  });

  constructor() {
    effect(() => {
      this.authService.authState();
      this.guestService.guestJwt();
      this.authVersion.update((v) => v + 1);
    });
  }
}
