import { Component, computed, inject, input } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';
import { PlayerService } from '../../services/player-service/player-service';

@Component({
  selector: 'app-player-profile-route',
  imports: [],
  templateUrl: './player-profile-route.html',
  styleUrl: './player-profile-route.css',
})
export class PlayerProfileRoute {
  identityService = inject(IdentityService);
  playerService = inject(PlayerService);
  id = input.required<string>();
  playerInfoRef = this.playerService.getPlayerInfoRef(() => this.id());
  playerInfo = computed(() => {
    if (this.playerInfoRef.hasValue()) {
      return this.playerInfoRef.value();
    }
    return null;
  });
  playerStatsRef = this.playerService.getPlayerStatsRef(() => this.id());
  playerStats = computed(() => {
    if (this.playerStatsRef.hasValue()) {
      return this.playerStatsRef.value();
    }
    return null;
  });
}
