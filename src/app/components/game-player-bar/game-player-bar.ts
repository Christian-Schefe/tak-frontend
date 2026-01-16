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

  playerInfo = this.playerService.getPlayerInfoRef(() => {
    const player = this.gamePlayer();
    if (player.type === 'player') {
      return player.playerId;
    }
    return undefined;
  });

  displayName = computed(() => {
    const player = this.gamePlayer();
    if (player.type === 'local') {
      return player.name;
    } else if (player.type === 'player') {
      if (this.playerInfo.hasValue()) {
        return this.playerInfo.value().displayName;
      }
      return null;
    } else {
      return null;
    }
  });

  rating = computed(() => {
    const player = this.gamePlayer();
    if (player.type === 'local') {
      return null;
    } else if (player.type === 'player') {
      if (this.playerInfo.hasValue()) {
        const rating = this.playerInfo.value().rating?.rating;
        return rating !== undefined ? Math.round(rating) : null;
      }
      return null;
    } else {
      return null;
    }
  });
}
