import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

type PlayerRating =
  | { type: 'unrated' }
  | {
      type: 'rated';
      player_id: string;
      rating: number;
      max_rating: number;
      rated_games_played: number;
      participation_rating: number;
    };

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  httpClient = inject(HttpClient);

  getPlayerRating(playerId: string) {
    return this.httpClient.get<PlayerRating>(`/api2/ratings/${playerId}`);
  }

  getPlayerRatingResource(playerId: () => string | undefined) {
    return httpResource<PlayerRating>(() => {
      const pid = playerId();
      if (!pid) {
        return undefined;
      }
      return `/api2/ratings/${pid}`;
    });
  }
}
