import { Component, computed, inject, input } from '@angular/core';
import { GamePlayer } from '../game-component/game-component';
import { PlayerService } from '../../services/player-service/player-service';

@Component({
  selector: 'app-game-player-bar',
  imports: [],
  templateUrl: './game-player-bar.html',
  styleUrl: './game-player-bar.css',
})
export class GamePlayerBar {
  playerService = inject(PlayerService);
  gamePlayer = input.required<GamePlayer>();

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
}
