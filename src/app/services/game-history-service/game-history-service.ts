import { Injectable } from '@angular/core';
import z from 'zod';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';

export const gameSettings = z.object({
  boardSize: z.number(),
  halfKomi: z.number(),
  pieces: z.number(),
  capstones: z.number(),
  timeSettings: z.union([
    z.object({
      type: z.literal('realtime'),
      contingentMs: z.number(),
      incrementMs: z.number(),
      extra: z
        .object({
          onMove: z.number(),
          extraMs: z.number(),
        })
        .nullable(),
    }),
    z.object({
      type: z.literal('async'),
      contingentMs: z.number(),
    }),
  ]),
});

export type GameSettings = z.infer<typeof gameSettings>;

const playerSnapshot = z.object({
  rating: z.number().nullable(),
  username: z.string().nullable(),
});

export const gameInfo = z.object({
  id: z.number(),
  date: z.number(),
  playerIds: z.object({
    white: z.string(),
    black: z.string(),
  }),
  isRated: z.boolean(),
  gameSettings,
});

export type GameInfo = z.infer<typeof gameInfo>;

const gameRecord = z.object({
  white: playerSnapshot,
  black: playerSnapshot,
  result: z.string().nullable(),
  ratingInfo: z
    .object({
      ratingChange: z.object({
        white: z.number(),
        black: z.number(),
      }),
    })
    .nullable(),
  ...gameInfo.shape,
});
export type GameRecord = z.infer<typeof gameRecord>;
const paginatedGameRecords = z.object({
  totalCount: z.number(),
  items: z.array(gameRecord),
});

@Injectable({
  providedIn: 'root',
})
export class GameHistoryService {
  playerGameHistory(
    params: () => { playerId: string; page: number; pageSize: number } | undefined,
  ) {
    return smartHttpResource(paginatedGameRecords, () => {
      const p = params();
      return p !== undefined
        ? `/api2/players/${p.playerId}/games?page=${p.page.toString()}&pageSize=${p.pageSize.toString()}`
        : undefined;
    });
  }
}
