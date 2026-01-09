import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';

interface AccountInfo {
  account_id: string;
  username: string;
  display_name: string;
  player_id: string;
  is_guest: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  httpClient = inject(HttpClient);
  account = signal<AccountInfo | null>(null);

  load(): Observable<AccountInfo | null> {
    console.log('IdentityService - loading account information');
    const whoami = this.httpClient.get<AccountInfo>('/api2/whoami');
    whoami.subscribe((data) => {
      this.account.set(data);
    });
    return whoami.pipe(
      catchError(() => {
        this.account.set(null);
        return of(null);
      }),
    );
  }
}
