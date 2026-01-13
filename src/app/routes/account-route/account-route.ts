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

  playerInfo = computed(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return null;
    }
    const resource = this.playerService.getPlayerInfo(identity.playerId);
    if (resource.hasValue()) {
      return resource.value();
    }
    return null;
  });
}
