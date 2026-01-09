import { inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { IdentityService } from '../../tak/identity-service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const identityService = inject(IdentityService);
  const router = inject(Router);

  console.log('Auth Guard - checking authentication status');

  return identityService.load().pipe(
    map((account) => {
      console.log('Auth Guard - account:', account);
      if (account !== null) {
        return true;
      } else {
        const loginPath = router.parseUrl('/authenticate');
        return new RedirectCommand(loginPath);
      }
    }),
  );
};
