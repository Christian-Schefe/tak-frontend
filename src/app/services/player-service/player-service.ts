import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import { inject, Injectable, Injector, runInInjectionContext, untracked } from '@angular/core';

export interface PlayerInfo {
  id: string;
  username: string;
  displayName: string;
  rating: PlayerRating;
}

export type PlayerRating =
  | { type: 'unrated' }
  | {
      type: 'rated';
      playerId: string;
      rating: number;
      maxRating: number;
      ratedGamesPlayed: number;
      participationRating: number;
    };

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  httpClient = inject(HttpClient);
  injector = inject(Injector);

  private cache = new Map<string, HttpResourceRef<PlayerInfo | undefined>>();

  getPlayerInfo(playerId: string): HttpResourceRef<PlayerInfo | undefined> {
    let res = this.cache.get(playerId);

    if (!res) {
      res = untracked(() =>
        runInInjectionContext(this.injector, () =>
          httpResource<PlayerInfo>(() => `/api2/players/${playerId}`),
        ),
      );
      this.cache.set(playerId, res);
    }

    return res;
  }
}
