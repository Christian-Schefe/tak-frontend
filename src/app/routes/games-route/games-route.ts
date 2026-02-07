import { Component, computed, inject } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { GameService } from '../../services/game-service/game-service';
import { GamesTableComponent } from '../../components/games-table-component/games-table-component';
import { CardModule } from 'primeng/card';
import { IdentityService } from '../../services/identity-service/identity-service';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-games-route',
  imports: [TabsModule, GamesTableComponent, CardModule, RouterLink, ButtonModule, RippleModule],
  templateUrl: './games-route.html',
  styleUrl: './games-route.css',
})
export class GamesRoute {
  private gameService = inject(GameService);
  private identityService = inject(IdentityService);
  private router = inject(Router);
  games = this.gameService.games;

  thisPlayerGames = computed(() => {
    const identity = this.identityService.identity();
    if (!identity) {
      return [];
    }
    const games = this.games();
    return games.filter(
      (game) =>
        game.playerIds.white === identity.playerId || game.playerIds.black === identity.playerId,
    );
  });

  onViewGame(gameId: number) {
    void this.router.navigate(['/online', gameId.toString()]);
  }
}
