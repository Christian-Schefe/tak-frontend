import { Component, computed, inject } from '@angular/core';
import { IdentityService } from '../../services/identity-service/identity-service';
import { PlayerService } from '../../services/player-service/player-service';

@Component({
  selector: 'app-account-route',
  imports: [],
  templateUrl: './account-route.html',
  styleUrl: './account-route.css',
})
export class AccountRoute {
  identityService = inject(IdentityService);
  playerService = inject(PlayerService);

  private playerInfoRef = this.playerService.getPlayerInfoRef(() => {
    const identity = this.identityService.identity();
    return identity?.playerId;
  });

  playerInfo = computed(() => {
    if (this.playerInfoRef.hasValue()) {
      return this.playerInfoRef.value();
    }
    return null;
  });
}
