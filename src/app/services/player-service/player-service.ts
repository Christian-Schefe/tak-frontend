import { HttpClient, httpResource, HttpResourceRef } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  Injector,
  runInInjectionContext,
  Signal,
  untracked,
} from '@angular/core';

export interface PlayerInfo {
  id: string;
  username: string;
  displayName: string;
  rating?: PlayerRating | null;
}

export interface PlayerRating {
  rating: number;
  participationRating: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  ratedGamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
}

@Injectable({
  providedIn: 'root',
})
export class PlayerService {
  httpClient = inject(HttpClient);
  injector = inject(Injector);

  private playerInfoCache = new Map<string, HttpResourceRef<PlayerInfo | undefined>>();

  getComputedPlayerInfos(
    playerIds: () => string[],
  ): Signal<Record<string, HttpResourceRef<PlayerInfo | undefined>>> {
    return computed(() => {
      const map: Record<string, HttpResourceRef<PlayerInfo | undefined>> = {};
      const players = playerIds();
      for (const playerId of players) {
        const cached = this.playerInfoCache.get(playerId);
        if (cached) {
          map[playerId] = cached;
          continue;
        }
        const resource = untracked(() =>
          runInInjectionContext(this.injector, () => {
            const pid = playerId;
            return this.getPlayerInfoRef(() => pid);
          }),
        );
        map[playerId] = resource;
        this.playerInfoCache.set(playerId, resource);
      }
      return map;
    });
  }

  getPlayerInfoRef(playerId: () => string | undefined): HttpResourceRef<PlayerInfo | undefined> {
    return httpResource<PlayerInfo>(() => {
      const pid = playerId();
      if (!pid) {
        return undefined;
      }
      return `/api2/players/${pid}`;
    });
  }

  getPlayerStatsRef(playerId: () => string | undefined): HttpResourceRef<PlayerStats | undefined> {
    return httpResource<PlayerStats>(() => {
      const pid = playerId();
      if (!pid) {
        return undefined;
      }
      return `/api2/players/${pid}/stats`;
    });
  }
}
