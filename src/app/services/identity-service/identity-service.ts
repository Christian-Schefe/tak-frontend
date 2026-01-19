import { computed, effect, inject, Injectable } from '@angular/core';
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

const accountInfoResponse = z.union([accountInfo, z.null()]);

type AccountInfoResponse = z.infer<typeof accountInfoResponse>;

type AccountInfo = z.infer<typeof accountInfo>;

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  httpClient = inject(HttpClient);
  authService = inject(AuthService);
  guestService = inject(GuestService);

  identityState = computed<AccountInfo | null | undefined>(() => {
    if (this.account.resource.hasValue()) {
      return this.account.value();
    } else {
      return undefined;
    }
  });

  account = smartHttpResource<AccountInfoResponse>(accountInfoResponse, () => {
    console.log('Fetching account info');
    return '/api2/whoami';
  });
  identity = this.account.lastValue;

  private readonly _refetchOnAuthChangeEffect = effect(() => {
    const authState = this.authService.authState();
    if (authState.type !== 'loading') {
      console.log('Auth state changed, refetching account info', authState);
      this.guestService.guestJwt();
      this.account.refetch();
    }
  });
}
