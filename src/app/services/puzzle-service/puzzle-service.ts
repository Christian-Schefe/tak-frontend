import { inject, Injectable } from '@angular/core';
import { smartHttpResource } from '../../util/smart-http-resource/smart-http-resource';
import z from 'zod';
import { gameBaseSettings } from '../game-history-service/game-history-service';
import { HttpClient } from '@angular/common/http';

const puzzleSchema = z.object({
  id: z.number(),
  actions: z.array(z.string()),
  gameSettings: gameBaseSettings,
});

type SolveResponse =
  | {
      type: 'correct';
    }
  | { type: 'incorrect' }
  | {
      type: 'continue';
      action: string;
    };

@Injectable({
  providedIn: 'root',
})
export class PuzzleService {
  private httpClient = inject(HttpClient);

  getRandomPuzzleId() {
    return this.httpClient.get<{ id: number }>('/api2/puzzles');
  }

  getPuzzle(puzzleId: () => string | undefined) {
    return smartHttpResource(puzzleSchema, () => {
      const id = puzzleId();
      if (id === undefined) {
        return undefined;
      }
      return `/api2/puzzles/${id}`;
    });
  }

  trySolvePuzzle(puzzleId: string, actions: string[]) {
    return this.httpClient.post<SolveResponse>(`/api2/puzzles/${puzzleId}`, { actions });
  }
}
