import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RoundPipe } from '../../util/round-pipe/round-pipe';
import { PlayerService } from '../../services/player-service/player-service';

@Component({
  selector: 'app-player-label',
  imports: [RouterLink, RoundPipe],
  templateUrl: './player-label.html',
  styleUrl: './player-label.css',
})
export class PlayerLabel {
  playerId = input.required<string | undefined>();
  playerService = inject(PlayerService);

  playerInfoRef = this.playerService.getComputedPlayerInfo(() => this.playerId());
  playerInfo = computed(() => {
    const ref = this.playerInfoRef();
    if (ref && ref.hasValue()) {
      return ref.value();
    }
    return null;
  });
}
