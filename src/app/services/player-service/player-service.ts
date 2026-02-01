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
import { Observable } from 'rxjs';

export interface PlayerInfo {
  id: string;
  accountId: string;
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
  private playerInfoByAccountIdCache = new Map<string, HttpResourceRef<PlayerInfo | undefined>>();

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

  getComputedPlayerInfosByAccountId(
    accountIds: () => string[],
  ): Signal<Record<string, HttpResourceRef<PlayerInfo | undefined>>> {
    return computed(() => {
      const map: Record<string, HttpResourceRef<PlayerInfo | undefined>> = {};
      const accounts = accountIds();
      for (const accountId of accounts) {
        const cached = this.playerInfoByAccountIdCache.get(accountId);
        if (cached) {
          map[accountId] = cached;
          continue;
        }
        const resource = untracked(() =>
          runInInjectionContext(this.injector, () => {
            const aid = accountId;
            return this.getPlayerInfoByAccountIdRef(() => aid);
          }),
        );
        map[accountId] = resource;
        this.playerInfoByAccountIdCache.set(accountId, resource);
      }
      return map;
    });
  }

  getPlayerInfoRef(playerId: () => string | undefined): HttpResourceRef<PlayerInfo | undefined> {
    return httpResource<PlayerInfo>(() => {
      const pid = playerId();
      if (pid === undefined) {
        return undefined;
      }
      return `/api2/players/${pid}`;
    });
  }

  getPlayerInfoByAccountIdRef(
    accountId: () => string | undefined,
  ): HttpResourceRef<PlayerInfo | undefined> {
    return httpResource<PlayerInfo>(() => {
      const aid = accountId();
      if (aid === undefined) {
        return undefined;
      }
      return `/api2/accounts/${aid}`;
    });
  }

  getPlayerByUsername(username: string): Observable<PlayerInfo | null> {
    return this.httpClient.get<PlayerInfo | null>(
      `/api2/usernames/${encodeURIComponent(username)}`,
    );
  }

  getPlayerStatsRef(playerId: () => string | undefined): HttpResourceRef<PlayerStats | undefined> {
    return httpResource<PlayerStats>(() => {
      const pid = playerId();
      if (pid === undefined) {
        return undefined;
      }
      return `/api2/players/${pid}/stats`;
    });
  }
}
