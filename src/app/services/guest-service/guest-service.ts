import { HttpClient } from '@angular/common/http';
import { effect, inject, Injectable, signal } from '@angular/core';
import { map } from 'rxjs';

interface GuestInfo {
  jwt: string;
}

const JWT_STORAGE_KEY = 'guestJwt';

@Injectable({
  providedIn: 'root',
})
export class GuestService {
  httpClient = inject(HttpClient);

  guestJwt = signal<string | null>(localStorage.getItem(JWT_STORAGE_KEY) || null);

  constructor() {
    effect(() => {
      const token = this.guestJwt();
      console.log('Syncing guest JWT:', token);
      if (token) {
        localStorage.setItem(JWT_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(JWT_STORAGE_KEY);
      }
    });
  }

  getGuestAccount() {
    return this.httpClient.get<GuestInfo>('/api2/guest').pipe(
      map((res) => {
        console.log('Guest account retrieved', res);
        this.guestJwt.set(res.jwt);
        return res;
      }),
    );
  }
}
