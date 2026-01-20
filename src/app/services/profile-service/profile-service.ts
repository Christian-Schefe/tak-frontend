import { inject, Injectable } from '@angular/core';
import z from 'zod';
import { zodHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import { HttpClient } from '@angular/common/http';

export const accountProfile = z.object({
  country: z.string().nullable(),
});

export type AccountProfile = z.infer<typeof accountProfile>;

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  httpClient = inject(HttpClient);

  getProfile(accountId: () => string) {
    return zodHttpResource(accountProfile, () => `/api2/profiles/${accountId()}`);
  }

  updateProfile(accountId: string, profile: AccountProfile) {
    return this.httpClient.post(`/api2/profiles/${accountId}`, profile);
  }
}
