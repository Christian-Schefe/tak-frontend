import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api2')) {
    return next(req);
  }
  const token = inject(IdentityService).getApiToken();
  if (token === null || token.length < 1) {
    return next(req);
  }
  const reqWithHeader = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  return next(reqWithHeader);
};
