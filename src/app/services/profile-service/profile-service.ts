import { inject, Injectable } from '@angular/core';
import z from 'zod';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import { HttpClient } from '@angular/common/http';

export const accountProfile = z.object({
  country: z.string().nullable(),
  profilePictureVersion: z.number(),
});

export interface AccountProfileUpdate {
  country: string | null;
}

export type AccountProfile = z.infer<typeof accountProfile>;

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  httpClient = inject(HttpClient);

  getProfile(accountId: () => string | undefined) {
    return smartHttpResource(accountProfile, () => {
      const id = accountId();
      if (id === undefined) {
        return undefined;
      }
      return `/api2/profiles/${id}`;
    });
  }

  updateProfile(profile: AccountProfileUpdate) {
    return this.httpClient.post('/api2/me/profile', profile);
  }

  getProfilePictureUrl(accountId: string, version: number) {
    return `/api2/profiles/${accountId}/picture?v=${version.toString()}`;
  }

  uploadProfilePicture(file: File) {
    const formData = new FormData();
    formData.append('picture', file);
    return this.httpClient.post('/api2/me/profile/picture', formData);
  }
}
