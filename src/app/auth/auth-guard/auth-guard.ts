import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { IdentityService } from '../../services/identity-service/identity-service';

export const authGuard: CanActivateFn = () => {
  const identityService = inject(IdentityService);
  const router = inject(Router);

  console.log('Auth Guard - checking authentication status');

  return toObservable(identityService.account.value).pipe(
    filter((v) => v !== undefined),
    take(1),
    map((v) => (v !== null ? true : router.createUrlTree(['/']))),
  );
};
