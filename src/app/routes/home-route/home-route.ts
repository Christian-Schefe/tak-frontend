import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { GameService } from '../../services/game-service/game-service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { PlayerService } from '../../services/player-service/player-service';
import { PlayerLabel } from "../../components/player-label/player-label";

@Component({
  selector: 'app-home-route',
  imports: [TableModule, CardModule, ButtonModule, RouterLink, PlayerLabel],
  templateUrl: './home-route.html',
  styleUrl: './home-route.css',
})
export class HomeRoute {
  gameService = inject(GameService);
  playerService = inject(PlayerService);
  ongoingGames = this.gameService.thisPlayerGames;

  playerInfos = this.playerService.getComputedPlayerInfos(() => {
    return this.gameService
      .thisPlayerGames()
      .flatMap((game) => [game.playerIds.white, game.playerIds.black]);
  });
}
