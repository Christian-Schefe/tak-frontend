import { Component, computed, inject, input } from '@angular/core';
import { GamePlayer } from '../game-component/game-component';
import { PlayerService } from '../../services/player-service/player-service';
import { GameClock } from '../game-clock/game-clock';
import { TakGameUI } from '../../../tak-core/ui';
import { TakPlayer } from '../../../tak-core';

@Component({
  selector: 'app-game-player-bar',
  templateUrl: './game-player-bar.html',
  styleUrl: './game-player-bar.css',
  imports: [GameClock],
})
export class GamePlayerBar {
  playerService = inject(PlayerService);
  gamePlayer = input.required<GamePlayer>();
  playerColor = input.required<TakPlayer>();
  game = input.required<TakGameUI>();

  playerInfoRef = this.playerService.getComputedPlayerInfo(() => {
    const player = this.gamePlayer();
    if (player.type === 'player') {
      return player.playerId;
    }
    return undefined;
  });

  playerInfo = computed(() => {
    const ref = this.playerInfoRef();
    if (ref && ref.hasValue()) {
      return ref.value();
    }
    return null;
  });

  displayName = computed(() => {
    const player = this.gamePlayer();
    if (player.type === 'local') {
      return player.name;
    } else {
      return this.playerInfo()?.displayName ?? null;
    }
  });

  rating = computed(() => {
    const player = this.gamePlayer();
    if (player.type === 'local') {
      return null;
    } else {
      const rating = this.playerInfo()?.rating?.rating;
      return rating !== undefined ? Math.round(rating) : null;
    }
  });
}
