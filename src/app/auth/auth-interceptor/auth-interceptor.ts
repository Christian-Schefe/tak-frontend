import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { GuestService } from '../../services/guest-service/guest-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api2')) {
    return next(req);
  }
  const guestToken = inject(GuestService).guestJwt();
  if (!guestToken) {
    return next(req);
  }
  const reqWithHeader = req.clone({
    setHeaders: {
      Authorization: `Bearer ${guestToken}`,
    },
  });
  return next(reqWithHeader);
};
