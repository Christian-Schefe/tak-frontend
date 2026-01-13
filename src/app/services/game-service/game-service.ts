import { httpResource } from '@angular/common/http';
import { effect, inject, Injectable, linkedSignal, signal } from '@angular/core';
import z from 'zod';
import { WsService } from '../ws-service/ws-service';

export type GameInfo = z.infer<typeof gameInfo>;

const gameInfo = z.object({
  id: z.number(),
  whiteId: z.string(),
  blackId: z.string(),
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
  isRated: z.boolean(),
});

@Injectable({
  providedIn: 'root',
})
export class GameService {
  wsService = inject(WsService);

  games = linkedSignal<GameInfo[] | undefined, GameInfo[]>({
    source: () => {
      if (this.gamesResource.hasValue()) {
        return this.gamesResource.value();
      }
      return undefined;
    },
    computation: (source, prev) => {
      if (!source) {
        return prev?.value ?? [];
      }
      return source;
    },
  });

  private refetchSignal = signal(0);

  gamesResource = httpResource<GameInfo[]>(() => {
    this.refetchSignal();
    return '/api2/games';
  });

  refetchGames() {
    console.log('Refetching games');
    this.refetchSignal.update((n) => n + 1);
  }

  constructor() {
    effect(() => {
      if (this.wsService.connected()) {
        this.refetchGames();
      }
    });
    effect((onCleanup) => {
      const cleanup = this.wsService.subscribe(
        'gameStarted',
        z.object({ game: gameInfo }),
        ({ game }) => {
          this.games.update((games) => {
            return [...games, game];
          });
        },
      );
      onCleanup(() => {
        cleanup();
      });
    });
    effect((onCleanup) => {
      const cleanup = this.wsService.subscribe(
        'gameEnded',
        z.object({ gameId: z.number() }),
        ({ gameId }) => {
          this.games.update((games) => {
            return games.filter((game) => game.id !== gameId);
          });
        },
      );
      onCleanup(() => {
        cleanup();
      });
    });
  }
}
