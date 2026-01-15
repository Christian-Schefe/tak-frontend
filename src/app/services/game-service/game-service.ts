import { effect, inject, Injectable, linkedSignal } from '@angular/core';
import z from 'zod';
import { WsService } from '../ws-service/ws-service';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import { IdentityService } from '../identity-service/identity-service';
import { Router } from '@angular/router';

export const gameSettings = z.object({
  boardSize: z.number(),
  halfKomi: z.number(),
  pieces: z.number(),
  capstones: z.number(),
  contingentMs: z.number(),
  incrementMs: z.number(),
  extra: z
    .object({
      onMove: z.number(),
      extraMs: z.number(),
    })
    .nullable(),
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
      type: z.literal('finished'),
      result: z.string(),
    }),
    z.object({
      type: z.literal('ongoing'),
      drawOffers: z.object({
        white: z.boolean(),
        black: z.boolean(),
      }),
      undoRequests: z.object({
        white: z.boolean(),
        black: z.boolean(),
      }),
    }),
  ]),
});

export type GameStatus = z.infer<typeof gameStatus>;
export type GameSettings = z.infer<typeof gameSettings>;
export type GameInfo = z.infer<typeof gameInfo>;

const gameInfo = z.object({
  id: z.number(),
  playerIds: z.object({
    white: z.string(),
    black: z.string(),
  }),
  isRated: z.boolean(),
  gameSettings,
});

@Injectable({
  providedIn: 'root',
})
export class GameService {
  wsService = inject(WsService);
  identityService = inject(IdentityService);
  router = inject(Router);

  gamesResource = smartHttpResource(z.array(gameInfo), () => '/api2/games');

  games = linkedSignal(() => this.gamesResource.lastValue() ?? []);

  gameStatus(gameId: () => number | undefined) {
    return smartHttpResource(gameStatus, () => {
      const gid = gameId();
      return gid ? `/api2/games/${gid}` : undefined;
    });
  }

  constructor() {
    effect(() => {
      if (this.wsService.connected()) {
        this.gamesResource.refetch();
      }
    });
    this.wsService.subscribeEffect('gameStarted', z.object({ game: gameInfo }), ({ game }) => {
      this.games.update((games) => {
        return [...games, game];
      });
    });
    this.wsService.subscribeEffect('gameEnded', z.object({ gameId: z.number() }), ({ gameId }) => {
      this.games.update((games) => {
        return games.filter((game) => game.id !== gameId);
      });
    });
    effect(() => {
      const games = this.games();
      const identity = this.identityService.identity();
      const thisPlayerGame = games.find((game) => {
        return (
          identity &&
          (game.playerIds.white === identity.playerId || game.playerIds.black === identity.playerId)
        );
      });
      if (thisPlayerGame) {
        this.router.navigate(['/app/online/', thisPlayerGame.id]);
      }
    });
  }
}
