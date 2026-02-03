import { computed, effect, inject, Injectable, linkedSignal, signal } from '@angular/core';
import z from 'zod';
import { WsService } from '../ws-service/ws-service';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import { IdentityService } from '../identity-service/identity-service';
import { Router } from '@angular/router';
import { TakGameSettings } from '../../../tak-core';
import { HttpClient } from '@angular/common/http';
import { GameInfo, gameInfo, gameSettings } from '../game-history-service/game-history-service';

export const gameRequest = z.object({
  id: z.number(),
  requestType: z.object({
    type: z.union([z.literal('undo'), z.literal('draw')]),
  }),
  fromPlayerId: z.string(),
});
export type GameRequestType = z.infer<typeof gameRequest>;

export const gameEndedMessage = z.object({
  gameId: z.number(),
  result: z.string(),
});

export const gameStatus = z.object({
  id: z.number(),
  playerIds: z.object({
    white: z.string(),
    black: z.string(),
  }),
  isRated: z.boolean(),
  gameSettings,
  actions: z.array(z.string()),
  remainingMs: z.object({
    white: z.number(),
    black: z.number(),
  }),
  status: z.union([
    z.object({
      type: z.literal('ended'),
      result: z.string(),
    }),
    z.object({
      type: z.literal('aborted'),
    }),
    z.object({
      type: z.literal('ongoing'),
      requests: z.array(gameRequest),
    }),
  ]),
});

export type GameStatus = z.infer<typeof gameStatus>;

@Injectable({
  providedIn: 'root',
})
export class GameService {
  wsService = inject(WsService);
  identityService = inject(IdentityService);
  router = inject(Router);
  httpClient = inject(HttpClient);

  localGameSettings = signal<TakGameSettings>({
    boardSize: 5,
    halfKomi: 0,
    reserve: { pieces: 21, capstones: 1 },
    /* clock: {
      type: 'realtime',
      contingentMs: 10 * 60 * 1000,
      incrementMs: 5 * 1000,
      externallyDriven: false,
      extra: {
        onMove: 5,
        extraMs: 5 * 60 * 1000,
      },
    },*/
    clock: {
      type: 'async',
      contingentMs: 24 * 60 * 60 * 1000,
      externallyDriven: false,
    },
  });

  startNewLocalGame(settings: TakGameSettings) {
    this.localGameSettings.set(settings);
  }

  gamesResource = smartHttpResource(z.array(gameInfo), () => '/api2/games');

  games = linkedSignal(() => {
    console.log('Updating games from resource');
    return this.gamesResource.lastValue() ?? [];
  });

  gameStatus(gameId: () => number | undefined) {
    return smartHttpResource(gameStatus, () => {
      const gid = gameId();
      return gid !== undefined ? `/api2/games/${gid.toString()}` : undefined;
    });
  }

  thisPlayerGames = computed(() => {
    const identity = this.identityService.identity();
    if (identity === null) {
      return [];
    }
    const playerId = identity.playerId;
    const games = this.games().filter(
      (game) => game.playerIds.white === playerId || game.playerIds.black === playerId,
    );
    console.log('This player games:', games);
    return games;
  });

  private readonly _refetchGamesOnConnectEffect = effect(() => {
    if (this.wsService.connected()) {
      this.gamesResource.refetch();
    }
  });

  private readonly _gameStartedEffect = this.wsService.subscribeEffect(
    'gameStarted',
    z.object({ game: gameInfo }),
    ({ game }) => {
      this.games.update((games) => {
        return [...games, game];
      });
      this.maybeNavigateToThisPlayerGame(game);
    },
  );

  private readonly _gameUpdatedEffect = this.wsService.subscribeEffect(
    'gameEnded',
    gameEndedMessage,
    ({ gameId }) => {
      this.games.update((games) => {
        return games.filter((game) => game.id !== gameId);
      });
    },
  );

  maybeNavigateToThisPlayerGame(game: GameInfo) {
    const identity = this.identityService.identity();
    const thisPlayerGame =
      identity !== null &&
      (game.playerIds.white === identity.playerId || game.playerIds.black === identity.playerId);
    if (thisPlayerGame) {
      void this.router.navigate(['/app/online/', game.id]);
    }
  }

  resignGame(gameId: number) {
    return this.httpClient.post(`/api2/games/${gameId.toString()}/resign`, {});
  }

  offerDraw(gameId: number) {
    return this.httpClient.post(`/api2/games/${gameId.toString()}/draw`, {});
  }
  requestUndo(gameId: number) {
    return this.httpClient.post(`/api2/games/${gameId.toString()}/undo`, {});
  }
  retractRequest(gameId: number, requestId: number) {
    return this.httpClient.delete(
      `/api2/games/${gameId.toString()}/requests/${requestId.toString()}`,
      {},
    );
  }
  respondToRequest(gameId: number, requestId: number, accept: boolean) {
    return this.httpClient.post(
      `/api2/games/${gameId.toString()}/requests/${requestId.toString()}`,
      {
        accept,
      },
    );
  }
}
