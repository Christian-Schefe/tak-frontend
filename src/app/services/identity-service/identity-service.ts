import { computed, effect, inject, Injectable, linkedSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GuestService } from '../guest-service/guest-service';
import { AuthService } from '../auth-service/auth-service';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import z from 'zod';

export const accountInfo = z.object({
  accountId: z.string(),
  playerId: z.string(),
  isGuest: z.boolean(),
  wsJwt: z.string(),
});

const accountInfoResponse = z.union([
  z.object({ type: z.literal('authenticated'), ...accountInfo.shape }),
  z.object({ type: z.literal('unauthenticated') }),
]);

type AccountInfoResponse = z.infer<typeof accountInfoResponse>;

type AccountInfo = z.infer<typeof accountInfo>;

type IdentityState = { type: 'loading' } | { type: 'loaded'; account: AccountInfo | null };

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  httpClient = inject(HttpClient);
  authService = inject(AuthService);
  guestService = inject(GuestService);

  identityState = computed<IdentityState>(() => {
    const val = this.account.value();
    if (val !== null) {
      return { type: 'loaded', account: val.type === 'authenticated' ? val : null };
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

  account = smartHttpResource<AccountInfoResponse>(accountInfoResponse, () => {
    console.log('Fetching account info');
    return '/api2/whoami';
  });

  constructor() {
    effect(() => {
      this.authService.authState();
      this.guestService.guestJwt();
      this.account.refetch();
    });
  }
}
