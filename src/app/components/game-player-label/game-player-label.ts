import { Component, computed, inject, input } from '@angular/core';
import { PlayerService } from '../../services/player-service/player-service';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { GamePlayer } from '../game-component/game-component';

@Component({
  selector: 'app-game-player-label',
  imports: [RoundPipe],
  templateUrl: './game-player-label.html',
  styleUrl: './game-player-label.css',
})
export class GamePlayerLabel {
  gamePlayer = input.required<GamePlayer>();
  playerService = inject(PlayerService);

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

  imageSrc = computed(() => {
    return '/pfp/default_pfp.jpg';
  });
}
